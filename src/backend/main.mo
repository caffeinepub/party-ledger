import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

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

  public type Logger = {
    logs : List.List<Text>;
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

  public type UpgradeData = {
    parties : [(PartyId, Party)];
    partyVisitRecords : [(PartyId, [PartyVisitRecord])];
    branding : ?ShopBranding;
  };

  public type UserProfile = {
    name : Text;
  };

  let parties = Map.empty<PartyId, Party>();
  let partyPayments = Map.empty<PartyId, List.List<(PaymentId, PartyVisitRecord)>>();
  let partyIdCounters = Map.empty<Text, Nat>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextPaymentId = 0;
  var shopBranding : ?ShopBranding = ?{
    name = ?"RK BROTHERS LUBRICANTS AND TYRE SUPPLIRES";
    logo = null;
  };
  let logger : Logger = { logs = List.empty<Text>() };

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

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Logging functions
  public shared ({ caller }) func logError(message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log errors");
    };
    logger.logs.add("Error: " # message);
  };

  public query func getLogs() : async [(Time.Time, Text)] {
    let logsArray = logger.logs.toArray();
    var timestampIdx = 0;
    logsArray.map(
      func(log) {
        let entry : (Time.Time, Text) = (timestampIdx, log);
        timestampIdx += 1;
        entry;
      }
    );
  };

  public shared ({ caller }) func clearLogs() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear logs");
    };
    logger.logs.clear();
  };

  // Shop branding functions
  public query func getShopBranding() : async ?ShopBranding {
    shopBranding;
  };

  public shared ({ caller }) func setShopBranding(name : ?Text, logo : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set shop branding");
    };
    shopBranding := ?{ name; logo };
  };

  // Party ID validation and generation
  public shared ({ caller }) func validateAndGenerateNewPartyId(name : Text, phone : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate party IDs");
    };
    let partyId = generatePartyIdFromNameAndPhone(name, phone);
    if (parties.containsKey(partyId)) {
      Runtime.trap("Party already exists");
    };
    partyId;
  };

  public shared ({ caller }) func validateAndGeneratePartyId(name : Text, phone : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate party IDs");
    };
    let partyId = generatePartyIdFromNameAndPhone(name, phone);
    if (parties.containsKey(partyId)) {
      Runtime.trap("Party already exists");
    };
    partyId;
  };

  // Party management functions
  public shared ({ caller }) func addParty(
    partyId : PartyId,
    name : Text,
    address : Text,
    phone : Text,
    pan : Text,
    dueAmount : Int,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add parties");
    };
    if (parties.containsKey(partyId)) {
      Runtime.trap("Party already exists");
    };

    let party : Party = {
      id = partyId;
      name;
      address;
      phone;
      pan;
      dueAmount;
    };

    parties.add(partyId, party);
  };

  public query func getAllParties() : async [(Text, Party)] {
    parties.toArray();
  };

  public query func getParty(_id : PartyId) : async ?{ name : Text; address : Text; phone : Text; pan : Text; dueAmount : Int } {
    switch (parties.get(_id)) {
      case (null) { null };
      case (?party) {
        ?{ name = party.name; address = party.address; phone = party.phone; pan = party.pan; dueAmount = party.dueAmount };
      };
    };
  };

  public shared ({ caller }) func updateParty(partyId : PartyId, name : Text, address : Text, phoneNumber : Text, pan : Text, dueAmount : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update parties");
    };
    if (not parties.containsKey(partyId)) {
      Runtime.trap("Party does not exist");
    };

    let party : Party = { id = partyId; name; address; phone = phoneNumber; pan; dueAmount };
    parties.add(partyId, party);
  };

  public shared ({ caller }) func deleteParty(partyId : PartyId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete parties");
    };
    parties.remove(partyId);
    partyPayments.remove(partyId);
  };

  // Payment and visit recording functions
  public shared ({ caller }) func recordPayment(partyId : PartyId, amount : Int, comment : Text, paymentDate : Time.Time, nextPayment : ?Time.Time) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record payments");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record party visits");
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

  // Query functions for visit records
  public query func getPartyVisitRecords(partyId : PartyId) : async [(PaymentId, PartyVisitRecord)] {
    switch (partyPayments.get(partyId)) {
      case (null) { ([] : [(PaymentId, PartyVisitRecord)]) };
      case (?paymentsList) {
        paymentsList.toArray().sort();
      };
    };
  };

  public query func getPartyVisitRecordMetadata(partyId : PartyId) : async [VisitRecordMetadata] {
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

  public query ({ caller }) func filterPartyVisitRecords(
    partyId : PartyId,
    _filter : PartyVisitRecordFilter,
  ) : async [(PaymentId, PartyVisitRecord)] {
    switch (partyPayments.get(partyId)) {
      case (null) { ([] : [(PaymentId, PartyVisitRecord)]) };
      case (?paymentsList) { paymentsList.toArray() };
    };
  };

  public query func filterPartyVisitRecordMetadata(
    partyId : PartyId,
    _filter : PartyVisitRecordFilter,
  ) : async AggregateVisitRecordMetadata {
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

  // Data import/export functions
  public shared ({ caller }) func importUpgradeData(data : UpgradeData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
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

  public query func exportUpgradeData() : async UpgradeData {
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

  // Test function
  public query func getPartyIdTest(name : Text, phone : Text) : async Text {
    generatePartyIdFromNameAndPhone(name, phone);
  };

  // Helper functions
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
