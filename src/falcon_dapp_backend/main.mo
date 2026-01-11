import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Buffer "mo:base/Buffer";
import Float "mo:base/Float";
import Timer "mo:base/Timer";
import Nat32 "mo:base/Nat32";
import Char "mo:base/Char";

persistent actor FalconBackend {
  
  type UserInfo = {
    walletAddress : Text;
    plan : Text;
    status : Text;
    registeredAt : Int;
    lastLoginAt : Int;
  };

  type TokenBalance = {
    symbol : Text;
    amount : Float;
    valueUSD : Float;
  };

  type WalletInfo = {
    address : Text;
    balanceICP : Float;
    balanceUSD : Float;
    tokens : [TokenBalance];
    transactionCount : Nat;
  };

  // ✨ NEW: Custom Token Type
  type CustomToken = {
    id : Text;
    canisterId : Text;
    name : Text;
    symbol : Text;
    decimals : Nat;
    addedAt : Int;
  };

  // ✨ NEW: User Preferences Type
  type UserPreferences = {
    hiddenTokens : [Text];
    customTokens : [CustomToken];
    updatedAt : Int;
  };

  // 🚀 NEW: Token Price Type
  public type TokenPrice = {
    symbol : Text;
    priceInUsd : Float;
    updatedAt : Int;
  };

  // 🚀 NEW: Transaction Type
  public type Transaction = {
    id : Text;
    timestamp : Int;
    from : Text;
    to : Text;
    amount : Float;
    tokenSymbol : Text;
    txType : Text;
  };

  var userEntries : [(Text, UserInfo)] = [];
  transient var users = HashMap.HashMap<Text, UserInfo>(0, Text.equal, Text.hash);

  // ✨ NEW: User Preferences Storage
  var preferencesEntries : [(Text, UserPreferences)] = [];
  transient var preferences = HashMap.HashMap<Text, UserPreferences>(0, Text.equal, Text.hash);

  // 🚀 NEW: Price Cache Storage
  var priceEntries : [(Text, TokenPrice)] = [];
  transient var priceCache = HashMap.HashMap<Text, TokenPrice>(0, Text.equal, Text.hash);

  // 🚀 NEW: Transaction History Storage
  var transactionEntries : [(Text, [Transaction])] = [];
  transient var userTransactions = HashMap.HashMap<Text, [Transaction]>(0, Text.equal, Text.hash);

  system func preupgrade() {
    userEntries := Iter.toArray(users.entries());
    preferencesEntries := Iter.toArray(preferences.entries());
    priceEntries := Iter.toArray(priceCache.entries());
    transactionEntries := Iter.toArray(userTransactions.entries());
  };

  system func postupgrade() {
    users := HashMap.fromIter<Text, UserInfo>(userEntries.vals(), userEntries.size(), Text.equal, Text.hash);
    userEntries := [];
    preferences := HashMap.fromIter<Text, UserPreferences>(preferencesEntries.vals(), preferencesEntries.size(), Text.equal, Text.hash);
    preferencesEntries := [];
    priceCache := HashMap.fromIter<Text, TokenPrice>(priceEntries.vals(), priceEntries.size(), Text.equal, Text.hash);
    priceEntries := [];
    userTransactions := HashMap.fromIter<Text, [Transaction]>(transactionEntries.vals(), transactionEntries.size(), Text.equal, Text.hash);
    transactionEntries := [];
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

  // Wallet fonksiyonları
  public query func getWalletInfo(address : Text) : async WalletInfo {
    // Şimdilik boş wallet bilgisi döndür
    // İleride gerçek balance ve token bilgilerini ICP ledger'dan çekeceğiz
    return {
      address = address;
      balanceICP = 0.0;
      balanceUSD = 0.0;
      tokens = [];
      transactionCount = 0;
    };
  };

  public query func getTokenBalances(_address : Text) : async [TokenBalance] {
    // Şimdilik boş array döndür
    // İleride gerçek token balance'larını döndüreceğiz
    return [];
  };

  // ==========================================
  // 🎯 USER PREFERENCES MANAGEMENT
  // ==========================================

  // Get user preferences
  public query func getUserPreferences(address : Text) : async ?UserPreferences {
    return preferences.get(address);
  };

  // Save hidden tokens list
  public shared func saveHiddenTokens(address : Text, hiddenTokens : [Text]) : async Bool {
    let now = Time.now();
    
    let currentPrefs = switch (preferences.get(address)) {
      case (?prefs) { prefs };
      case null {
        {
          hiddenTokens = [];
          customTokens = [];
          updatedAt = now;
        }
      };
    };

    let updated : UserPreferences = {
      hiddenTokens = hiddenTokens;
      customTokens = currentPrefs.customTokens;
      updatedAt = now;
    };

    preferences.put(address, updated);
    return true;
  };

  // Add custom token
  public shared func addCustomToken(
    address : Text,
    canisterId : Text,
    name : Text,
    symbol : Text,
    decimals : Nat
  ) : async Bool {
    let now = Time.now();
    
    let currentPrefs = switch (preferences.get(address)) {
      case (?prefs) { prefs };
      case null {
        {
          hiddenTokens = [];
          customTokens = [];
          updatedAt = now;
        }
      };
    };

    // Check if token already exists
    let exists = Array.find<CustomToken>(
      currentPrefs.customTokens,
      func(t) { t.canisterId == canisterId }
    );

    if (exists != null) {
      return false; // Token already added
    };

    let newToken : CustomToken = {
      id = symbol # "-" # canisterId;
      canisterId = canisterId;
      name = name;
      symbol = symbol;
      decimals = decimals;
      addedAt = now;
    };

    let updatedTokens = Array.append<CustomToken>(currentPrefs.customTokens, [newToken]);

    let updated : UserPreferences = {
      hiddenTokens = currentPrefs.hiddenTokens;
      customTokens = updatedTokens;
      updatedAt = now;
    };

    preferences.put(address, updated);
    return true;
  };

  // Remove custom token
  public shared func removeCustomToken(address : Text, canisterId : Text) : async Bool {
    let now = Time.now();
    
    let currentPrefs = switch (preferences.get(address)) {
      case (?prefs) { prefs };
      case null { return false; };
    };

    let updatedTokens = Array.filter<CustomToken>(
      currentPrefs.customTokens,
      func(t) { t.canisterId != canisterId }
    );

    let updated : UserPreferences = {
      hiddenTokens = currentPrefs.hiddenTokens;
      customTokens = updatedTokens;
      updatedAt = now;
    };

    preferences.put(address, updated);
    return true;
  };

  // Get custom tokens only
  public query func getCustomTokens(address : Text) : async [CustomToken] {
    switch (preferences.get(address)) {
      case (?prefs) { return prefs.customTokens; };
      case null { return []; };
    };
  };

  // Get hidden tokens only
  public query func getHiddenTokens(address : Text) : async [Text] {
    switch (preferences.get(address)) {
      case (?prefs) { return prefs.hiddenTokens; };
      case null { return []; };
    };
  };

  // ==========================================
  // 🚀 HTTPS OUTCALLS - PRICE CACHE SYSTEM
  // ==========================================

  // Management Canister Interface
  type IC = actor {
    http_request : HttpRequestArgs -> async HttpResponsePayload;
  };

  type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HttpHeader];
    body : ?[Nat8];
    method : HttpMethod;
    transform : ?TransformRawResponseFunction;
  };

  type HttpHeader = {
    name : Text;
    value : Text;
  };

  type HttpMethod = {
    #get;
    #post;
    #head;
  };

  type HttpResponsePayload = {
    status : Nat;
    headers : [HttpHeader];
    body : [Nat8];
  };

  type TransformRawResponseFunction = {
    function : shared query TransformArgs -> async HttpResponsePayload;
    context : Blob;
  };

  type TransformArgs = {
    response : HttpResponsePayload;
    context : Blob;
  };

  let ic : IC = actor ("aaaaa-aa");

  // Transform function for HTTP response cleanup
  public query func transform(raw : TransformArgs) : async HttpResponsePayload {
    let transformed : HttpResponsePayload = {
      status = raw.response.status;
      body = raw.response.body;
      headers = [
        {
          name = "Content-Security-Policy";
          value = "default-src 'self'";
        },
        { name = "Referrer-Policy"; value = "strict-origin" },
        { name = "Permissions-Policy"; value = "geolocation=(self)" },
        {
          name = "Strict-Transport-Security";
          value = "max-age=63072000";
        },
        { name = "X-Frame-Options"; value = "DENY" },
        { name = "X-Content-Type-Options"; value = "nosniff" },
      ];
    };
    transformed;
  };

  // Update price cache from CoinGecko API
  public func updatePriceCache() : async () {
    let host = "api.coingecko.com";
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer,bitcoin,ethereum,tether&vs_currencies=usd";

    let http_request : HttpRequestArgs = {
      url = url;
      max_response_bytes = ?10_000;
      headers = [
        { name = "Host"; value = host },
        { name = "User-Agent"; value = "falcon_wallet_canister" },
      ];
      body = null;
      method = #get;
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
    };

    try {
      let http_response = await (with cycles = 230_000_000_000) ic.http_request(http_request);

      if (http_response.status == 200) {
        let response_body = http_response.body;
        let decoded_text = switch (Text.decodeUtf8(Blob.fromArray(response_body))) {
          case (?text) { text };
          case null { "" };
        };

        // Simple JSON parsing for price extraction
        let now = Time.now();
        
        // Parse ICP price
        if (Text.contains(decoded_text, #text "internet-computer")) {
          let icpPrice = extractPrice(decoded_text, "internet-computer");
          priceCache.put("ICP", {
            symbol = "ICP";
            priceInUsd = icpPrice;
            updatedAt = now;
          });
        };

        // Parse BTC price
        if (Text.contains(decoded_text, #text "bitcoin")) {
          let btcPrice = extractPrice(decoded_text, "bitcoin");
          priceCache.put("ckBTC", {
            symbol = "ckBTC";
            priceInUsd = btcPrice;
            updatedAt = now;
          });
        };

        // Parse ETH price
        if (Text.contains(decoded_text, #text "ethereum")) {
          let ethPrice = extractPrice(decoded_text, "ethereum");
          priceCache.put("ckETH", {
            symbol = "ckETH";
            priceInUsd = ethPrice;
            updatedAt = now;
          });
        };

        // Parse USDT price
        if (Text.contains(decoded_text, #text "tether")) {
          let usdtPrice = extractPrice(decoded_text, "tether");
          priceCache.put("ckUSDT", {
            symbol = "ckUSDT";
            priceInUsd = usdtPrice;
            updatedAt = now;
          });
        };

        Debug.print("✅ Price cache updated successfully");
      } else {
        Debug.print("⚠️ HTTP request failed with status: " # debug_show(http_response.status));
      };
    } catch (_error) {
      Debug.print("❌ Error updating price cache");
    };
  };

  // Helper function to extract price from JSON response
  private func extractPrice(json : Text, coinId : Text) : Float {
    // Simple extraction: look for pattern like "internet-computer":{"usd":123.45}
    
    // Use Text.contains for simple check and extract manually
    if (not Text.contains(json, #text (coinId # "\":{\"usd\":"))) {
      return 0.0;
    };
    
    // Find the usd value after coin ID
    let parts = Text.split(json, #text (coinId # "\":{\"usd\":"));
    let afterCoin = switch (parts.next()) {
      case null { return 0.0; };
      case (?_first) {
        switch (parts.next()) {
          case null { return 0.0; };
          case (?second) { second };
        };
      };
    };
    
    let numberStr = extractNumberFromStart(afterCoin);
    
    // Parse float manually (simple approach)
    parseFloat(numberStr);
  };

  // Simple float parser
  private func parseFloat(str : Text) : Float {
    // For simplicity, we'll use a basic approach
    // In production, you'd want a more robust parser
    if (str == "") return 0.0;
    
    // Try to find decimal point
    let parts = Text.split(str, #char '.');
    let wholePart = switch (parts.next()) {
      case null { return 0.0; };
      case (?w) { w };
    };
    
    let wholeNum = textToNat(wholePart);
    
    switch (parts.next()) {
      case null {
        // No decimal part
        Float.fromInt(wholeNum);
      };
      case (?decimalPart) {
        let decimalNum = textToNat(decimalPart);
        let decimals = Text.size(decimalPart);
        let divisor = Float.fromInt(natPow(10, decimals));
        Float.fromInt(wholeNum) + (Float.fromInt(decimalNum) / divisor);
      };
    };
  };

  // Convert text to nat
  private func textToNat(txt : Text) : Nat {
    var num : Nat = 0;
    for (c in txt.chars()) {
      if (c >= '0' and c <= '9') {
        let digit = Nat32.toNat(Char.toNat32(c) - Char.toNat32('0'));
        num := num * 10 + digit;
      };
    };
    num;
  };

  // Power function for nat
  private func natPow(base : Nat, exp : Nat) : Nat {
    var result = 1;
    var i = 0;
    while (i < exp) {
      result *= base;
      i += 1;
    };
    result;
  };

  // Extract number string from start of text
  private func extractNumberFromStart(text : Text) : Text {
    let chars = Text.toArray(text);
    let buffer = Buffer.Buffer<Char>(20);
    
    for (c in chars.vals()) {
      if (c == '0' or c == '1' or c == '2' or c == '3' or c == '4' or 
          c == '5' or c == '6' or c == '7' or c == '8' or c == '9' or c == '.') {
        buffer.add(c);
      } else {
        if (buffer.size() > 0) {
          return Text.fromArray(Buffer.toArray(buffer));
        };
      };
    };
    
    return Text.fromArray(Buffer.toArray(buffer));
  };

  // Get cached token prices (query function for frontend)
  public query func getTokenPrices() : async [TokenPrice] {
    let prices = Buffer.Buffer<TokenPrice>(10);
    
    for ((symbol, price) in priceCache.entries()) {
      prices.add(price);
    };
    
    return Buffer.toArray(prices);
  };

  // System timer to update prices every 5 minutes (300 seconds)
  let timerInterval : Nat = 300_000_000_000; // 5 minutes in nanoseconds
  
  ignore Timer.recurringTimer<system>(#nanoseconds timerInterval, func() : async () {
    await updatePriceCache();
  });

  // Manual trigger for initial price update (call once after deployment)
  public func initializePrices() : async Text {
    await updatePriceCache();
    return "✅ Price cache initialized";
  };

  // ==========================================
  // 🚀 TRANSACTION HISTORY CACHE
  // ==========================================

  // Add transaction to user history
  public shared(_msg) func addTransaction(
    userAddress : Text,
    txId : Text,
    from : Text,
    to : Text,
    amount : Float,
    tokenSymbol : Text,
    txType : Text
  ) : async Bool {
    let now = Time.now();
    
    let newTx : Transaction = {
      id = txId;
      timestamp = now;
      from = from;
      to = to;
      amount = amount;
      tokenSymbol = tokenSymbol;
      txType = txType;
    };

    let currentTxs = switch (userTransactions.get(userAddress)) {
      case (?txs) { txs };
      case null { [] };
    };

    // Prepend new transaction (most recent first)
    let updatedTxs = Array.append<Transaction>([newTx], currentTxs);
    
    // Keep only last 100 transactions per user to save storage
    let limitedTxs = if (updatedTxs.size() > 100) {
      Array.subArray<Transaction>(updatedTxs, 0, 100);
    } else {
      updatedTxs;
    };

    userTransactions.put(userAddress, limitedTxs);
    return true;
  };

  // Get user transaction history
  public query func getUserTransactions(address : Text) : async [Transaction] {
    switch (userTransactions.get(address)) {
      case (?txs) { return txs; };
      case null { return []; };
    };
  };

  // Get recent transactions (last N)
  public query func getRecentTransactions(address : Text, limit : Nat) : async [Transaction] {
    switch (userTransactions.get(address)) {
      case (?txs) {
        if (txs.size() <= limit) {
          return txs;
        } else {
          return Array.subArray<Transaction>(txs, 0, limit);
        };
      };
      case null { return []; };
    };
  };
};
