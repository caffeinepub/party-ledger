import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Apply migration on canister upgrade

actor {
  // Integrate storage and authorization mixins
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type LoginName = Text;
  type Password = Text;
  type PartyId = Text;
  type PaymentId = Text;

  public type Location = {
    latitude : Float;
    longitude : Float;
  };

  public type IntConstraint = {
    #greaterThan : Int;
    #lessThan : Int;
    #equals : Int;
  };

  public type TextConstraint = {
    #contains : Text;
    #equals : Text;
    #greaterThan : Text;
    #lessThan : Text;
  };

  public type TimeConstraint = {
    #before : Time.Time;
    #after : Time.Time;
    #equals : Time.Time;
  };

  public type LocationConstraint = {
    #withinRadius : (Float, Float, Float);
    #greaterLatitude : Float;
    #greaterLongitude : Float;
    #lessLatitude : Float;
    #lessLongitude : Float;
  };

  public type PartyVisitRecordFilter = {
    amountFilter : ?IntConstraint;
    paymentDateFilter : ?TimeConstraint;
    nextPaymentDateFilter : ?TimeConstraint;
    commentFilter : ?TextConstraint;
    locationFilter : ?LocationConstraint;
  };

  type Party = {
    id : PartyId;
    name : Text;
    address : Text;
    phone : Text;
    pan : Text;
    dueAmount : Int;
  };

  public type ShopBranding = {
    name : ?Text;
    logo : ?Storage.ExternalBlob;
  };

  public type PartyVisitRecord = {
    amount : Int;
    paymentDate : Time.Time;
    nextPaymentDate : ?Time.Time;
    comment : Text;
    location : ?Location;
  };

  public type VisitRecordMetadata = {
    paymentId : PaymentId;
    hasLocation : Bool;
    hasNextPaymentDate : Bool;
  };

  public type AggregateVisitRecordMetadata = {
    allPaymentsMetadata : [VisitRecordMetadata];
    filteredPaymentsMetadata : [VisitRecordMetadata];
  };

  public type StaffAccount = {
    loginName : LoginName;
    password : Password;
    boundPrincipal : ?Principal;
    isDisabled : Bool;
    canViewAllRecords : Bool;
  };

  public type StaffAccountInfo = {
    loginName : LoginName;
    boundPrincipal : ?Principal;
    isDisabled : Bool;
    canViewAllRecords : Bool;
  };

  public type UpgradeData = {
    parties : [(PartyId, Party)];
    partyVisitRecords : [(PartyId, [PartyVisitRecord])];
    branding : ?ShopBranding;
  };

  // State
  let parties = Map.empty<PartyId, Party>();
  let partyPayments = Map.empty<PartyId, List.List<(PaymentId, PartyVisitRecord)>>();
  let staffAccounts = Map.empty<LoginName, StaffAccount>();
  let partyIdCounters = Map.empty<Text, Nat>();
  var nextPaymentId = 0;
  var shopBranding : ?ShopBranding = null;
  let adminLoginName : Text = "rkbrothers.lts";
  let secondaryAdminLogin : Text = "rajan";

  let userProfiles = Map.empty<Principal, {
    name : Text;
    staffLoginName : ?LoginName;
  }>();

  module PartyVisitRecord {
    public func compare(tuple1 : (PaymentId, PartyVisitRecord), tuple2 : (PaymentId, PartyVisitRecord)) : Order.Order {
      Text.compare(tuple1.0, tuple2.0);
    };
  };

  module VisitRecordMetadata {
    public func compare(tuple1 : VisitRecordMetadata, tuple2 : VisitRecordMetadata) : Order.Order {
      Text.compare(tuple1.paymentId, tuple2.paymentId);
    };
  };

  module Party {
    public func compare(p1 : (Text, Party), p2 : (Text, Party)) : Order.Order {
      Text.compare(p1.0, p2.0);
    };
  };

  func isAuthenticatedStaff(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.staffLoginName) {
          case (null) { false };
          case (?loginName) {
            switch (staffAccounts.get(loginName)) {
              case (null) { false };
              case (?account) {
                not account.isDisabled and account.boundPrincipal == ?caller;
              };
            };
          };
        };
      };
    };
  };

  func canStaffViewAllRecords(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };

    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.staffLoginName) {
          case (null) { false };
          case (?loginName) {
            switch (staffAccounts.get(loginName)) {
              case (null) { false };
              case (?account) {
                not account.isDisabled and account.canViewAllRecords;
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func setAdminStaffPassword(adminPassword : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set admin staff password");
    };

    let adminAccount : StaffAccount = {
      loginName = adminLoginName;
      password = adminPassword;
      boundPrincipal = null;
      isDisabled = false;
      canViewAllRecords = true;
    };

    staffAccounts.add(adminLoginName, adminAccount);
  };

  public shared ({ caller }) func createStaffAccount(
    loginName : LoginName,
    password : Password,
    canViewAllRecords : Bool,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create staff accounts");
    };

    if (staffAccounts.containsKey(loginName)) {
      Runtime.trap("Staff account already exists");
    };

    let account : StaffAccount = {
      loginName;
      password;
      boundPrincipal = null;
      isDisabled = false;
      canViewAllRecords;
    };

    staffAccounts.add(loginName, account);
  };

  public shared ({ caller }) func updateStaffAccount(
    loginName : LoginName,
    newPassword : ?Password,
    canViewAllRecords : ?Bool,
    isDisabled : ?Bool,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update staff accounts");
    };

    switch (staffAccounts.get(loginName)) {
      case (null) {
        Runtime.trap("Staff account does not exist");
      };
      case (?account) {
        let updatedAccount : StaffAccount = {
          loginName = account.loginName;
          password = switch (newPassword) {
            case (null) { account.password };
            case (?pwd) { pwd };
          };
          boundPrincipal = account.boundPrincipal;
          isDisabled = switch (isDisabled) {
            case (null) { account.isDisabled };
            case (?disabled) { disabled };
          };
          canViewAllRecords = switch (canViewAllRecords) {
            case (null) { account.canViewAllRecords };
            case (?canView) { canView };
          };
        };
        staffAccounts.add(loginName, updatedAccount);
      };
    };
  };

  public shared ({ caller }) func disableStaffAccount(loginName : LoginName) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can disable staff accounts");
    };

    switch (staffAccounts.get(loginName)) {
      case (null) {
        Runtime.trap("Staff account does not exist");
      };
      case (?account) {
        let updatedAccount : StaffAccount = {
          loginName = account.loginName;
          password = account.password;
          boundPrincipal = account.boundPrincipal;
          isDisabled = true;
          canViewAllRecords = account.canViewAllRecords;
        };
        staffAccounts.add(loginName, updatedAccount);
      };
    };
  };

  public query ({ caller }) func listStaffAccounts() : async [StaffAccountInfo] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list staff accounts");
    };

    staffAccounts.values().toArray().map(
      func(account : StaffAccount) : StaffAccountInfo {
        {
          loginName = account.loginName;
          boundPrincipal = account.boundPrincipal;
          isDisabled = account.isDisabled;
          canViewAllRecords = account.canViewAllRecords;
        };
      }
    );
  };

  public shared ({ caller }) func authenticateStaff(loginName : LoginName, password : Password) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be authenticated with Internet Identity");
    };

    switch (staffAccounts.get(loginName)) {
      case (null) {
        false;
      };
      case (?account) {
        if (account.isDisabled) {
          return false;
        };

        if (account.password != password) {
          return false;
        };

        switch (account.boundPrincipal) {
          case (null) {
            let updatedAccount : StaffAccount = {
              loginName = account.loginName;
              password = account.password;
              boundPrincipal = ?caller;
              isDisabled = account.isDisabled;
              canViewAllRecords = account.canViewAllRecords;
            };
            staffAccounts.add(loginName, updatedAccount);
          };
          case (?boundPrincipal) {
            if (boundPrincipal != caller) {
              Runtime.trap("This staff account is bound to a different Internet Identity");
            };
          };
        };

        let profile = switch (userProfiles.get(caller)) {
          case (null) {
            {
              name = "";
              staffLoginName = ?loginName;
            };
          };
          case (?existingProfile) {
            {
              name = existingProfile.name;
              staffLoginName = ?loginName;
            };
          };
        };
        userProfiles.add(caller, profile);

        true;
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?{
    name : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch user profile");
    };

    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) {
        ?{ name = profile.name };
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?{
    name : Text;
  } {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) {
        ?{ name = profile.name };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : {
    name : Text;
  }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let existingProfile = userProfiles.get(caller);
    let staffLoginName = switch (existingProfile) {
      case (null) { null };
      case (?p) { p.staffLoginName };
    };

    userProfiles.add(
      caller,
      {
        name = profile.name;
        staffLoginName;
      },
    );
  };

  public shared ({ caller }) func setShopBranding(name : ?Text, logo : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set shop branding");
    };

    shopBranding := ?{ name; logo };
  };

  public query ({ caller }) func getShopBranding() : async ?ShopBranding {
    shopBranding;
  };

  public shared ({ caller }) func validateAndGenerateNewPartyId(name : Text, phone : Text) : async Text {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can generate party IDs");
    };

    let partyId = generatePartyIdFromNameAndPhone(name, phone);
    if (parties.containsKey(partyId)) {
      Runtime.trap("Party already exists");
    };
    partyId;
  };

  public shared ({ caller }) func addParty(partyId : PartyId, name : Text, address : Text, phone : Text, pan : Text, dueAmount : Int) : async () {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can add parties");
    };

    if (parties.containsKey(partyId)) {
      Runtime.trap("Party already exists");
    };
    let party : Party = { id = partyId; name; address; phone; pan; dueAmount };
    parties.add(partyId, party);
  };

  public query ({ caller }) func getAllParties() : async [(Text, Party)] {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can view parties");
    };

    if (not canStaffViewAllRecords(caller)) {
      Runtime.trap("Unauthorized: Your account does not have permission to view all parties");
    };

    parties.toArray();
  };

  public query ({ caller }) func getParty(_id : PartyId) : async ?{
    name : Text;
    address : Text;
    phone : Text;
    pan : Text;
    dueAmount : Int;
  } {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can view party details");
    };

    if (not canStaffViewAllRecords(caller)) {
      Runtime.trap("Unauthorized: Your account does not have permission to view party details");
    };

    switch (parties.get(_id)) {
      case (null) { null };
      case (?party) {
        ?{
          name = party.name;
          address = party.address;
          phone = party.phone;
          pan = party.pan;
          dueAmount = party.dueAmount;
        };
      };
    };
  };

  public shared ({ caller }) func updateParty(partyId : PartyId, name : Text, address : Text, phoneNumber : Text, pan : Text, dueAmount : Int) : async () {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can update parties");
    };

    if (not parties.containsKey(partyId)) {
      Runtime.trap("Party does not exist");
    };

    let party : Party = {
      id = partyId;
      name;
      address;
      phone = phoneNumber;
      pan;
      dueAmount;
    };
    parties.add(partyId, party);
  };

  public shared ({ caller }) func deleteParty(partyId : PartyId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete parties");
    };

    parties.remove(partyId);
    partyPayments.remove(partyId);
  };

  public shared ({ caller }) func recordPayment(partyId : PartyId, amount : Int, comment : Text, paymentDate : Time.Time, nextPayment : ?Time.Time) : async Text {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can record payments");
    };

    if (not parties.containsKey(partyId)) {
      Runtime.trap("Party does not exist");
    };

    if (amount == 0) {
      switch (nextPayment) {
        case (null) { Runtime.trap("Next payment date is required when amount is 0") };
        case (?_) {};
      };
    };

    let paymentId = nextPaymentId.toText();
    nextPaymentId += 1;

    let partyVisitRecord : PartyVisitRecord = {
      amount;
      comment;
      paymentDate;
      nextPaymentDate = nextPayment;
      location = null;
    };

    let paymentsList = switch (partyPayments.get(partyId)) {
      case (null) {
        let newList = List.empty<(PaymentId, PartyVisitRecord)>();
        partyPayments.add(partyId, newList);
        newList;
      };
      case (?existingList) { existingList };
    };

    paymentsList.add((paymentId, partyVisitRecord));
    paymentId;
  };

  public shared ({ caller }) func recordPartyVisit(partyId : PartyId, amount : Int, comment : Text, paymentDate : Time.Time, nextPayment : ?Time.Time, location : ?Location) : async Text {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can record visits");
    };

    if (not parties.containsKey(partyId)) {
      Runtime.trap("Party does not exist");
    };

    if (amount == 0) {
      switch (nextPayment) {
        case (null) { Runtime.trap("Next payment date is required when amount is 0") };
        case (?_) {};
      };
    };

    let paymentId = nextPaymentId.toText();
    nextPaymentId += 1;

    let partyVisitRecord : PartyVisitRecord = {
      amount;
      comment;
      paymentDate;
      nextPaymentDate = nextPayment;
      location;
    };

    let paymentsList = switch (partyPayments.get(partyId)) {
      case (null) {
        let newList = List.empty<(PaymentId, PartyVisitRecord)>();
        partyPayments.add(partyId, newList);
        newList;
      };
      case (?existingList) { existingList };
    };

    paymentsList.add((paymentId, partyVisitRecord));
    paymentId;
  };

  public query ({ caller }) func getPartyVisitRecords(partyId : PartyId) : async [(PaymentId, PartyVisitRecord)] {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can view visit records");
    };

    if (not canStaffViewAllRecords(caller)) {
      Runtime.trap("Unauthorized: Your account does not have permission to view visit records");
    };

    switch (partyPayments.get(partyId)) {
      case (null) { ([] : [(PaymentId, PartyVisitRecord)]) };
      case (?paymentsList) {
        paymentsList.toArray().sort();
      };
    };
  };

  public query ({ caller }) func getPartyVisitRecordMetadata(partyId : PartyId) : async [VisitRecordMetadata] {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can view visit record metadata");
    };

    if (not canStaffViewAllRecords(caller)) {
      Runtime.trap("Unauthorized: Your account does not have permission to view visit record metadata");
    };

    switch (partyPayments.get(partyId)) {
      case (null) { ([] : [VisitRecordMetadata]) };
      case (?paymentsList) {
        let metadataArray = paymentsList.toArray().map(
          func((paymentId, record)) {
            {
              paymentId;
              hasLocation = record.location != null;
              hasNextPaymentDate = record.nextPaymentDate != null;
            };
          }
        );
        metadataArray;
      };
    };
  };

  public query ({ caller }) func filterPartyVisitRecords(partyId : PartyId, _filter : PartyVisitRecordFilter) : async [(PaymentId, PartyVisitRecord)] {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can filter visit records");
    };

    if (not canStaffViewAllRecords(caller)) {
      Runtime.trap("Unauthorized: Your account does not have permission to view visit records");
    };

    switch (partyPayments.get(partyId)) {
      case (null) { ([] : [(PaymentId, PartyVisitRecord)]) };
      case (?paymentsList) { paymentsList.toArray() };
    };
  };

  public query ({ caller }) func filterPartyVisitRecordMetadata(partyId : PartyId, _filter : PartyVisitRecordFilter) : async AggregateVisitRecordMetadata {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can filter visit record metadata");
    };

    if (not canStaffViewAllRecords(caller)) {
      Runtime.trap("Unauthorized: Your account does not have permission to view visit record metadata");
    };

    let allPaymentsMetadata = switch (partyPayments.get(partyId)) {
      case (null) { ([] : [VisitRecordMetadata]) };
      case (?paymentsList) {
        let metadataArray = paymentsList.toArray().map(
          func((paymentId, record)) {
            {
              paymentId;
              hasLocation = record.location != null;
              hasNextPaymentDate = record.nextPaymentDate != null;
            };
          }
        );
        metadataArray;
      };
    };

    {
      allPaymentsMetadata;
      filteredPaymentsMetadata = allPaymentsMetadata;
    };
  };

  public shared ({ caller }) func importUpgradeData(data : UpgradeData) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can import data");
    };

    parties.clear();
    partyPayments.clear();

    for ((partyId, party) in data.parties.values()) {
      parties.add(partyId, party);
    };

    for ((partyId, recordsArray) in data.partyVisitRecords.values()) {
      let recordsList = List.empty<(PaymentId, PartyVisitRecord)>();
      var idx = 0;
      for (record in recordsArray.values()) {
        recordsList.add((idx.toText(), record));
        idx += 1;
      };
      partyPayments.add(partyId, recordsList);
    };

    shopBranding := data.branding;
  };

  public query ({ caller }) func exportUpgradeData() : async UpgradeData {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can export data");
    };

    let recordsArray = partyPayments.toArray().map(
      func((partyId, recordsList)) : (PartyId, [PartyVisitRecord]) {
        let records = recordsList.toArray().map(
          func((_, record)) { record }
        );
        (partyId, records);
      }
    );

    {
      parties = parties.toArray();
      partyVisitRecords = recordsArray;
      branding = shopBranding;
    };
  };

  public query ({ caller }) func getPartyIdTest(name : Text, phone : Text) : async Text {
    if (not isAuthenticatedStaff(caller)) {
      Runtime.trap("Unauthorized: Only authenticated staff can test party ID generation");
    };

    generatePartyIdFromNameAndPhone(name, phone);
  };

  func generatePartyIdFromNameAndPhone(name : Text, _phone : Text) : Text {
    name # "." # getNextIdAndIncrement(name).toText();
  };

  func getNextIdAndIncrement(key : Text) : Nat {
    switch (partyIdCounters.get(key)) {
      case (null) {
        partyIdCounters.add(key, 1);
        0;
      };
      case (?currentValue) {
        partyIdCounters.add(key, Nat.add(currentValue, 1));
        currentValue;
      };
    };
  };
};

