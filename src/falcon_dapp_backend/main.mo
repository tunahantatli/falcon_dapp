import Debug "mo:base/Debug";

persistent actor {
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };

  public shared func login(walletAddress : Text) : async { plan : Text; status : Text } {
    Debug.print("login: " # walletAddress);
    return { plan = "Standard"; status = "Active" };
  };
};
