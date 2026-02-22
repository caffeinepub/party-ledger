import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";

module {
  type PartyId = Text;
  type PaymentId = Text;
  type Party = {
    id : PartyId;
    name : Text;
    address : Text;
    phone : Text;
    pan : Text;
    dueAmount : Int;
  };
  type PartyVisitRecord = {
    amount : Int;
    paymentDate : Int;
    nextPaymentDate : ?Int;
    comment : Text;
    location : ?{ latitude : Float; longitude : Float };
  };
  type OldActor = {
    parties : Map.Map<PartyId, Party>;
    partyPayments : Map.Map<PartyId, List.List<(PaymentId, PartyVisitRecord)>>;
  };

  type NewActor = {
    parties : Map.Map<PartyId, Party>;
    partyPayments : Map.Map<PartyId, List.List<(PaymentId, PartyVisitRecord)>>;
  };

  public func run(old : OldActor) : NewActor {
    let cleanedParties = Map.empty<PartyId, Party>();

    for ((partyId, party) in old.parties.entries()) {
      if (not cleanedParties.containsKey(partyId)) {
        cleanedParties.add(partyId, party);
      };
    };

    { old with parties = cleanedParties };
  };
};
