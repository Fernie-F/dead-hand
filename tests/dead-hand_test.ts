import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.14.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
  name: "Ensure that we can add new inheritors",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet1 = accounts.get("wallet_1") as Account;
    let wallet2 = accounts.get("wallet_2") as Account;


    let assetMaps = chain.getAssetsMaps();

    let block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        wallet2.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "get-last-update-block-time",
        [],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "is-alive",
        [],
        wallet2.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "is-inheritor",
        [],
        wallet1.address
      ),
    ]);
    // assertEquals(block.receipts.length, 4);
    // adding inheritors
    assertEquals(block.receipts[0].result, `(ok true)`);
    assertEquals(block.receipts[1].result, `(ok false)`);
    assertEquals(block.receipts[2].result, `(err u100)`);

    // life getters
    assertEquals(block.receipts[3].result, `u0`);
    assertEquals(block.receipts[4].result, `true`);

    // inheritors getters
    assertEquals(block.receipts[5].result, `true`);

    assertEquals(block.height, 2);


    // adding funds
    block = chain.mineBlock([
      Tx.transferSTX(
        10000,
        `${deployerWallet.address}.dead-hand`,
        deployerWallet.address,
      ),
      Tx.transferSTX(
        10000,
        `${deployerWallet.address}.dead-hand`,
        deployerWallet.address,
      ),
      Tx.transferSTX(
        10000,
        `${deployerWallet.address}.dead-hand`,
        deployerWallet.address,
      ),
    ]);

    assertEquals(block.receipts.length, 3);
    assertEquals(block.receipts[0].result, `(ok true)`);
    assetMaps = chain.getAssetsMaps();
    assertEquals(assetMaps.assets['STX'][`${deployerWallet.address}.dead-hand`], 30000);
    assertEquals(block.height, 3);


    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "get-last-update-block-time",
        [],
        wallet1.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    assertEquals(block.receipts[0].result, `u0`);
    assertEquals(block.height, 4);

    chain.mineEmptyBlockUntil(1006);

    block = chain.mineBlock([
    ]);

    assertEquals(block.height, 1007);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "is-alive",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "get-last-update-block-time",
        [],
        wallet1.address
      ),
    ]);

    assertEquals(block.receipts[0].result, `true`);
    assertEquals(block.receipts[1].result, `u0`);
    assertEquals(block.height, 1008);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "is-alive",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "get-time-of-death",
        [],
        wallet1.address
      ),
    ]);

    // console.log(assetMaps);
    assertEquals(block.receipts[0].result, `true`);
    assertEquals(block.receipts[1].result, `u1008`);
    assertEquals(block.height, 1009);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "is-alive",
        [],
        wallet1.address
      ),
    ]);

    assertEquals(block.receipts[0].result, `false`);

    assetMaps = chain.getAssetsMaps();

  },
});

Clarinet.test({
  name: "Ensure only the deployer can reset the lifetime",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet1 = accounts.get("wallet_1") as Account;

    chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        deployerWallet.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "reset-lifetime",
        [],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "reset-lifetime",
        [],
        wallet1.address
      ),
    ]);

    assertEquals(block.receipts[0].result, `(ok true)`);
    assertEquals(block.receipts[1].result, `(err u100)`);

  }
});

Clarinet.test({
  name: "Ensure that the deployer can reset lifetime",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet1 = accounts.get("wallet_1") as Account;
    let wallet2 = accounts.get("wallet_2") as Account;

    let block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet2.address)],
        deployerWallet.address
      ),
      Tx.transferSTX(
        100000,
        `${deployerWallet.address}.dead-hand`,
        deployerWallet.address,
      ),
    ]);

    let empty = chain.mineEmptyBlockUntil(903);
    assertEquals(empty.block_height, 903);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "reset-lifetime",
        [],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "get-last-update-block-time",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "get-time-of-death",
        [],
        wallet1.address
      ),
    ]);

    assertEquals(block.receipts[0].result, `(ok true)`);
    assertEquals(block.receipts[1].result, `u903`);
    assertEquals(block.receipts[2].result, `u1911`);

  }
});

Clarinet.test({
  name: "Ensure that when the deployer stops updating, inheritors can get funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet1 = accounts.get("wallet_1") as Account;
    let wallet2 = accounts.get("wallet_2") as Account;


    let block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        deployerWallet.address
      ),
      Tx.transferSTX(
        3000000000, // 3_000 STX
        `${deployerWallet.address}.dead-hand`,
        deployerWallet.address,
      ),
    ]);

    let empty = chain.mineEmptyBlockUntil(1009);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "is-alive",
        [],
        deployerWallet.address
      ),
    ]);

    assertEquals(block.receipts[0].result, `false`);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "unlock-safe",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet1.address
      ),
    ]);

    let assetMaps = chain.getAssetsMaps();
    assertEquals(block.receipts[0].result, `(ok true)`);
    assertEquals(block.receipts[1].result, `(ok true)`);
    assertEquals(assetMaps.assets['STX'][`${wallet1.address}`], 100003000000000);

  }
});

Clarinet.test({
  name: "Ensure that inheritors get the correct amount of with even funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet1 = accounts.get("wallet_1") as Account;
    let wallet2 = accounts.get("wallet_2") as Account;


    let block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet2.address)],
        deployerWallet.address
      ),
      Tx.transferSTX(
        3000000000, // 300_0 STX
        `${deployerWallet.address}.dead-hand`,
        deployerWallet.address,
      ),
    ]);

    let empty = chain.mineEmptyBlockUntil(1009);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "unlock-safe",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet2.address
      ),
    ]);

    let assetMaps = chain.getAssetsMaps();
    assertEquals(block.receipts[0].result, `(ok true)`); // 100 thou
    assertEquals(block.receipts[1].result, `(ok true)`);         //1000000000
    assertEquals(block.receipts[2].result, `(ok true)`);
    assertEquals(assetMaps.assets['STX'][`${wallet1.address}`], 100001500000000);
    assertEquals(assetMaps.assets['STX'][`${wallet2.address}`], 100001500000000);
  }
});

Clarinet.test({
  name: "Ensure that inheritors get the correct amount of with odd funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet1 = accounts.get("wallet_1") as Account;
    let wallet2 = accounts.get("wallet_2") as Account;
    let wallet3 = accounts.get("wallet_3") as Account;


    let block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet2.address)],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet3.address)],
        deployerWallet.address
      ),
      Tx.transferSTX(
        1000000000, // 300_0 STX
        `${deployerWallet.address}.dead-hand`,
        deployerWallet.address,
      ),
    ]);

    let empty = chain.mineEmptyBlockUntil(1009);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "unlock-safe",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet2.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet3.address
      ),
    ]);

    let assetMaps = chain.getAssetsMaps();
    assertEquals(block.receipts[0].result, `(ok true)`); // 100 thou
    assertEquals(block.receipts[1].result, `(ok true)`);         //1000000000
    assertEquals(block.receipts[2].result, `(ok true)`);         //1000000000
    assertEquals(block.receipts[3].result, `(ok true)`);
    assertEquals(assetMaps.assets['STX'][`${wallet1.address}`], 100000333333333);
    assertEquals(assetMaps.assets['STX'][`${wallet2.address}`], 100000333333333);
    assertEquals(assetMaps.assets['STX'][`${wallet3.address}`], 100000333333334);
  }
});

Clarinet.test({
  name: "Ensure that inheritors can only claim once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet1 = accounts.get("wallet_1") as Account;
    let wallet2 = accounts.get("wallet_2") as Account;
    let wallet3 = accounts.get("wallet_3") as Account;


    let block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet1.address)],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet2.address)],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "add-inheritor",
        [types.principal(wallet3.address)],
        deployerWallet.address
      ),
      Tx.transferSTX(
        1000000000, // 300_0 STX
        `${deployerWallet.address}.dead-hand`,
        deployerWallet.address,
      ),
    ]);

    let empty = chain.mineEmptyBlockUntil(1009);

    block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "unlock-safe",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet1.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet2.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "release-stx-funds",
        [],
        wallet2.address
      ),
    ]);

    let assetMaps = chain.getAssetsMaps();
    assertEquals(block.receipts[0].result, `(ok true)`); // 100 thou
    assertEquals(block.receipts[1].result, `(ok true)`);
    assertEquals(block.receipts[2].result, `(ok true)`);
    assertEquals(block.receipts[3].result, `(err u102)`);
    assertEquals(assetMaps.assets['STX'][`${wallet1.address}`], 100000333333333);
    assertEquals(assetMaps.assets['STX'][`${wallet2.address}`], 100000333333333);
  }
});


Clarinet.test({
  name: "Ensure that we can deposit tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet1 = accounts.get("wallet_1") as Account;
    let wallet2 = accounts.get("wallet_2") as Account;
    let wallet3 = accounts.get("wallet_3") as Account;


    let block = chain.mineBlock([
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "deposit-tokens",
        [
          types.principal(deployerWallet.address + "." + "test-token"),
          types.uint(1000000000),

        ],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "deposit-tokens",
        [
          types.principal(deployerWallet.address + "." + "test-token-1"),
          types.uint(1000000000),

        ],
        deployerWallet.address
      ),
      Tx.contractCall(
        `${deployerWallet.address}.dead-hand`,
        "deposit-tokens",
        [
          types.principal(deployerWallet.address + "." + "test-token-2"),
          types.uint(1000000000),

        ],
        deployerWallet.address
      ),
      // Tx.contractCall(
      //   `${deployerWallet.address}.dead-hand`,
      //   "release-token",
      //   [
      //     types.list([`'${deployerWallet.address}.test-token-2`]),
      //   ],
      //   deployerWallet.address
      // ),
      // Tx.contractCall(
      //   `${deployerWallet.address}.dead-hand`,
      //   "test-this",
      //   [
      //     `'${deployerWallet.address}.test-token-2`,
      //   ],
      //   deployerWallet.address
      // ),
    ]);

    // console.log(block.receipts[1].result);

  }
});