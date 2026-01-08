import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Iter "mo:base/Iter";

persistent actor FalconBackend {
  
  type UserInfo = {
    walletAddress : Text;
    plan : Text;
    status : Text;
    registeredAt : Int;
    lastLoginAt : Int;
  };

  stable var userEntries : [(Text, UserInfo)] = [];
  transient var users = HashMap.HashMap<Text, UserInfo>(0, Text.equal, Text.hash);

  system func preupgrade() {
    userEntries := Iter.toArray(users.entries());
  };

  system func postupgrade() {
    users := HashMap.fromIter<Text, UserInfo>(userEntries.vals(), userEntries.size(), Text.equal, Text.hash);
    userEntries := [];
  };

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };

  public shared func login(walletAddress : Text) : async { plan : Text; status : Text } {
    Debug.print("login: " # walletAddress);
    
    let now = Time.now();
    
    switch (users.get(walletAddress)) {
      case (?user) {
        let updated : UserInfo = {
          walletAddress = user.walletAddress;
          plan = user.plan;
          status = user.status;
          registeredAt = user.registeredAt;
          lastLoginAt = now;
        };
        users.put(walletAddress, updated);
        return { plan = user.plan; status = user.status };
      };
      case null {
        let newUser : UserInfo = {
          walletAddress = walletAddress;
          plan = "Standard";
          status = "Active";
          registeredAt = now;
          lastLoginAt = now;
        };
        users.put(walletAddress, newUser);
        return { plan = "Standard"; status = "Active" };
      };
    };
  };

  public query func getUserInfo(walletAddress : Text) : async ?UserInfo {
    return users.get(walletAddress);
  };

  public query func getUserCount() : async Nat {
    return users.size();
  };
};
