import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  InvestPool,
  LPtoken,
  RoleContract,
  UnitedSD,
} from "../typechain-types";

describe("HH unit tests", () => {
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let manager: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  let user6: SignerWithAddress;
  let user7: SignerWithAddress;
  let user8: SignerWithAddress;
  let user9: SignerWithAddress;
  let user10: SignerWithAddress;
  let users: any;
  let usd: UnitedSD;
  let roleContract: RoleContract;
  let LPToken: LPtoken;
  let investPool: InvestPool;
  let fundrisingWallet: any;
  let price = 110;

  const airDropUSD = async (user: any, amount: any) => {
    let _amount = utils.parseEther(amount.toString());
    await usd.mint(user.address, _amount);
    expect(await usd.balanceOf(user.address)).to.equal(_amount);
  };

  const givaAllAprroves = async (user: any, amount: any) => {
    await usd.connect(user).approve(investPool.address, amount);
    expect(await usd.allowance(user.address, investPool.address)).to.equal(
      amount
    );
  };

  before(async () => {
    fundrisingWallet = ethers.Wallet.createRandom();
    signers = await ethers.getSigners();
    owner = signers[0];
    signer = signers[1];
    manager = signers[2];
    user1 = signers[3];
    user2 = signers[4];
    user3 = signers[5];
    user4 = signers[6];
    user5 = signers[7];
    user6 = signers[8];
    user7 = signers[9];
    user8 = signers[10];
    user9 = signers[11];
    user10 = signers[12];
    users = [
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
      user10,
    ];
  });
  it("Deploys all contracts and mint LP on InvestPool and USD to users", async () => {
    const USD = await ethers.getContractFactory("UnitedSD");
    const LP = await ethers.getContractFactory("LPtoken");
    const Role = await ethers.getContractFactory("RoleContract");
    const Invest = await ethers.getContractFactory("InvestPool");

    const unitedSD = await USD.deploy();
    const lp = await LP.deploy("testing", "tst", manager.address);
    const role = await upgrades.deployProxy(Role, [
      signer.address,
      manager.address,
      [
        {
          roleNumber: 0,
          isExist: true,
          maxAmount: utils.parseEther("100"),
          minAmount: 0,
        },
        {
          roleNumber: 1,
          isExist: true,
          maxAmount: utils.parseEther("500"),
          minAmount: 0,
        },
        {
          roleNumber: 2,
          isExist: true,
          maxAmount: utils.parseEther("1000"),
          minAmount: utils.parseEther("500"),
        },
      ],
    ]);
    const invest = await Invest.deploy(
      lp.address,
      role.address,
      unitedSD.address,
      fundrisingWallet.address,
      5,
      price,
      utils.parseEther("1200"),
      manager.address,
      [
        {
          roleNumber: 0,
          startTime: Math.floor(Date.now() / 1000) + 1000,
          deadline: Math.floor(Date.now() / 1000) + 3000,
          roleFee: 20,
          maxAmountToSellForRole: utils.parseEther("100"),
        },
        {
          roleNumber: 1,
          startTime: Math.floor(Date.now() / 1000) + 50,
          deadline: Math.floor(Date.now() / 1000) + 1000,
          roleFee: 10,
          maxAmountToSellForRole: utils.parseEther("600"),
        },
        {
          roleNumber: 2,
          startTime: Math.floor(Date.now() / 1000) + 50,
          deadline: Math.floor(Date.now() / 1000) + 3000,
          roleFee: 0,
          maxAmountToSellForRole: utils.parseEther("1500"),
        },
      ]
    );

    expect(unitedSD.address).to.not.eq(ethers.constants.AddressZero);
    expect(lp.address).to.not.eq(ethers.constants.AddressZero);
    expect(role.address).to.not.eq(ethers.constants.AddressZero);
    expect(invest.address).to.not.eq(ethers.constants.AddressZero);

    usd = unitedSD as UnitedSD;
    LPToken = lp as LPtoken;
    roleContract = role as RoleContract;
    investPool = invest as InvestPool;

    await LPToken.mint(investPool.address, utils.parseEther("2700"));
    expect(await LPToken.balanceOf(investPool.address)).to.eq(
      utils.parseEther("2700")
    );

    for (let i = 0; i < users.length; i++) {
      await airDropUSD(users[i], 1000000);
      await givaAllAprroves(users[i], ethers.constants.MaxUint256);
    }
  });

  it("Grants roles for further tests", async () => {
    await roleContract.connect(manager).giveRole(user1.address, 1, 1);
    expect(await roleContract.getRoleNumber(user1.address)).to.eq(1);

    await roleContract.connect(manager).giveRole(user2.address, 1, 1);
    expect(await roleContract.getRoleNumber(user2.address)).to.eq(1);

    await roleContract.connect(manager).giveRole(user3.address, 2, 1);
    expect(await roleContract.getRoleNumber(user3.address)).to.eq(2);
  });

  it("Checks reverts: IA and TE", async () => {
    await expect(
      investPool.connect(user1).buy(utils.parseEther("600"))
    ).to.be.revertedWith("IA");

    await expect(
      investPool.connect(user1).buy(utils.parseEther("300"))
    ).to.be.revertedWith("TE");
  });

  it("Tests buy function", async () => {
    await ethers.provider.send("evm_increaseTime", [120]); // 2 min

    expect(await usd.balanceOf(user1.address)).to.eq(
      utils.parseEther("1000000")
    );
    expect(await LPToken.balanceOf(user1.address)).to.eq(0);

    await investPool.connect(user1).buy(utils.parseEther("500"));

    expect(await usd.balanceOf(user1.address)).to.eq(
      utils.parseEther("999500")
    );
    expect(await LPToken.balanceOf(user1.address)).to.eq(
      "450000000000000000000"
    );
  });

  it("Checks reverts: RR and LT", async () => {
    await expect(
      investPool.connect(user2).buy(utils.parseEther("500"))
    ).to.be.revertedWith("RR");

    await expect(
      investPool.connect(user3).buy(utils.parseEther("1000"))
    ).to.be.revertedWith("LT");
  });
});
