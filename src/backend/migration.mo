import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldUserProfiles = Map.Map<Principal, Text>;
  type NewUserProfiles = Map.Map<Principal, { name : Text }>;

  type OldActor = {
    userProfiles : OldUserProfiles;
    staffAccounts : Map.Map<Text, {
      loginName : Text;
      boundPrincipal : ?Principal;
      isDisabled : Bool;
      canViewAllRecords : Bool;
    }>;
  };

  type NewActor = {
    userProfiles : NewUserProfiles;
  };

  public func run(old : OldActor) : NewActor {
    {
      userProfiles = old.userProfiles.map<Principal, Text, { name : Text }>(
        func(_p, name) { { name } }
      );
    };
  };
};
