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

  public type PaginatedPartyVisitRecordResponse = {
    records : [(Text, PartyVisitRecord)];
    nextOffset : Nat;
    totalRecords : Nat;
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

  public type Party = {
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

  public shared ({ caller }) func logError(message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log errors");
    };
    logger.logs.add("Error: " # message);
  };

  public query ({ caller }) func getLogs() : async [(Time.Time, Text)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view logs");
    };
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

  public query func getShopBranding() : async ?ShopBranding {
    shopBranding;
  };

  public shared ({ caller }) func setShopBranding(name : ?Text, logo : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set shop branding");
    };
    shopBranding := ?{ name; logo };
  };

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

  public query ({ caller }) func getAllParties() : async [(Text, Party)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parties");
    };
    let partiesArray = parties.toArray();
    let sortedParties = partiesArray.sort(
      func(a, b) {
        return Text.compare(a.0, b.0);
      }
    );
    sortedParties;
  };

  public query ({ caller }) func getAllPartiesWithVisitRecords() : async [(Text, Party, [PartyVisitRecord])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view parties with visit records");
    };
    (parties.keys()).toArray().map(
      func(partyId) {
        switch (partyPayments.get(partyId), parties.get(partyId)) {
          case (null, ?_) { ([] : [(Text, Party, [PartyVisitRecord])]) };
          case (?visitRecords, ?party) {
            [(partyId, party, (visitRecords.values()).toArray().map(func(tuple) { tuple.1 }))];
          };
          case (_, null) { ([] : [(Text, Party, [PartyVisitRecord])]) };
        };
      }
    ).flatten();
  };

  public query ({ caller }) func getParty(_id : PartyId) : async ?{ name : Text; address : Text; phone : Text; pan : Text; dueAmount : Int } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view party details");
    };
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

  public query ({ caller }) func getPartyVisitRecords(partyId : PartyId) : async [(PaymentId, PartyVisitRecord)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view visit records");
    };
    switch (partyPayments.get(partyId)) {
      case (null) { ([] : [(PaymentId, PartyVisitRecord)]) };
      case (?paymentsList) {
        paymentsList.toArray().sort();
      };
    };
  };

  public query ({ caller }) func getPartyVisitRecordMetadata(partyId : PartyId) : async [VisitRecordMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view visit record metadata");
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

  public query ({ caller }) func filterPartyVisitRecords(
    partyId : PartyId,
    _filter : PartyVisitRecordFilter,
  ) : async [(PaymentId, PartyVisitRecord)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can filter visit records");
    };
    switch (partyPayments.get(partyId)) {
      case (null) { ([] : [(PaymentId, PartyVisitRecord)]) };
      case (?paymentsList) { paymentsList.toArray() };
    };
  };

  public query ({ caller }) func filterPartyVisitRecordMetadata(
    partyId : PartyId,
    _filter : PartyVisitRecordFilter,
  ) : async AggregateVisitRecordMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can filter visit record metadata");
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

  public query ({ caller }) func paginatedPartyVisitRecords(
    partyId : PartyId,
    offset : Nat,
    limit : Nat,
  ) : async PaginatedPartyVisitRecordResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view paginated visit records");
    };
    switch (partyPayments.get(partyId)) {
      case (null) {
        {
          records = ([] : [(Text, PartyVisitRecord)]);
          nextOffset = offset;
          totalRecords = 0;
        };
      };
      case (?paymentsList) {
        let allRecords = paymentsList.toArray().sort();
        let totalRecords = allRecords.size();
        let end = Nat.min(offset + limit, totalRecords);
        let views = allRecords.sliceToArray(offset, end);
        {
          records = views;
          nextOffset = end;
          totalRecords;
        };
      };
    };
  };

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

  public query ({ caller }) func exportUpgradeData() : async UpgradeData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can test party ID generation");
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

  func isSameDay(time1 : Time.Time, time2 : Time.Time) : Bool {
    let oneDay = 24 * 3600 * 1_000_000_000;
    let diff = Int.abs(time1 - time2);
    diff <= oneDay;
  };

  public query ({ caller }) func getPartiesWithVisits(
    startDate : ?Time.Time,
    endDate : ?Time.Time,
    includeLocation : Bool,
  ) : async [(PartyId, [PartyVisitRecord])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };

    let filteredResultList = List.empty<(PartyId, [PartyVisitRecord])>();

    for ((partyId, recordsList) in partyPayments.entries()) {
      let filteredRecords = List.empty<PartyVisitRecord>();

      for ((_, record) in recordsList.values()) {
        let isWithinRange = switch (startDate, endDate) {
          case (?start, ?end) { record.paymentDate >= start and record.paymentDate <= end };
          case (?start, null) { record.paymentDate >= start };
          case (null, ?end) { record.paymentDate <= end };
          case (null, null) { true };
        };

        if (isWithinRange) {
          if (not includeLocation or record.location != null) {
            filteredRecords.add(record);
          };
        };
      };

      if (filteredRecords.size() > 0) {
        filteredResultList.add(
          (partyId, filteredRecords.toArray())
        );
      };
    };

    filteredResultList.toArray();
  };

  public query ({ caller }) func getPartiesWithTodayDuePayments() : async [(PartyId, [PartyVisitRecord])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let today = Time.now();
    let resultList = List.empty<(PartyId, [PartyVisitRecord])>();

    for ((partyId, recordsList) in partyPayments.entries()) {
      let todaysRecords = List.empty<PartyVisitRecord>();
      for ((_, record) in recordsList.values()) {
        switch (record.nextPaymentDate) {
          case (?date) {
            if (isSameDay(date, today)) {
              todaysRecords.add(record);
            };
          };
          case (null) {};
        };
      };
      if (todaysRecords.size() > 0) {
        resultList.add((partyId, todaysRecords.toArray()));
      };
    };

    resultList.toArray();
  };
};
