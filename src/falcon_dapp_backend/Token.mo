/// Token.mo — FTCNG ICRC-1 Ledger arayüzü ve yardımcı tipleri
/// main.mo tarafından import edilerek kullanılır.
import Float     "mo:base/Float";
import Principal "mo:base/Principal";

module {

  // ── ICRC-1 Tip Tanımları ─────────────────────────────────────────────────

  public type Account = {
    owner      : Principal;
    subaccount : ?Blob;
  };

  public type TransferArgs = {
    to              : Account;
    fee             : ?Nat;
    memo            : ?Blob;
    from_subaccount : ?Blob;
    created_at_time : ?Nat64;
    amount          : Nat;
  };

  public type TransferError = {
    #BadFee            : { expected_fee    : Nat   };
    #BadBurn           : { min_burn_amount : Nat   };
    #InsufficientFunds : { balance         : Nat   };
    #TooOld;
    #CreatedInFuture   : { ledger_time     : Nat64 };
    #Duplicate         : { duplicate_of    : Nat   };
    #TemporarilyUnavailable;
    #GenericError      : { message : Text; error_code : Nat };
  };

  public type TransferResult = { #Ok : Nat; #Err : TransferError };

  // ── Ledger Canister Arayüzü (ICRC-1) ────────────────────────────────────

  public type LedgerInterface = actor {
    icrc1_transfer     : (TransferArgs) -> async TransferResult;
    icrc1_balance_of   : (Account)      -> async Nat;
    icrc1_name         : ()             -> async Text;
    icrc1_symbol       : ()             -> async Text;
    icrc1_decimals     : ()             -> async Nat8;
    icrc1_fee          : ()             -> async Nat;
    icrc1_total_supply : ()             -> async Nat;
  };

  // ── Factory: Principal'dan Ledger Actor üret ─────────────────────────────

  public func getLedger(canisterId : Principal) : LedgerInterface {
    actor (Principal.toText(canisterId)) : LedgerInterface;
  };

  // ── FTCNG Sabit Değerleri ─────────────────────────────────────────────────
  // 1 FTCNG (altın gram) = 10^8 = 100_000_000 base unit
  public let FTCNG_DECIMALS : Nat8 = 8;
  public let FTCNG_ONE_GRAM : Nat  = 100_000_000; // 10^FTCNG_DECIMALS

  /// Gram değerini ledger'ın beklediği base-unit değerine çevirir.
  /// Örnek: gramsToBase(2) = 200_000_000
  public func gramsToBase(grams : Nat) : Nat { grams * FTCNG_ONE_GRAM };

  /// Base-unit değerini okunabilir gram değerine çevirir (Float).
  public func baseToGrams(base : Nat) : Float {
    Float.fromInt(base) / 100_000_000.0;
  };
}
