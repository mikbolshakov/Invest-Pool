import { ethers } from "hardhat";
import { utils } from "ethers";
import hre from "hardhat";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

// npx hardhat run scripts/deploy.ts --network chain
async function main() {
  const manager = "0x2c84C3D16AaAC1157919D9210CBC7b8797F5A91a";
  let price = 110;
  let fundrisingWallet = ethers.Wallet.createRandom();
  console.log("Address: " + fundrisingWallet.address);
  console.log("Private Key: " + fundrisingWallet.privateKey);

  const transfers = await ethers.getContractFactory("TransferHelper");
  const investPool = await ethers.getContractFactory("InvestPool");
  const lpToken = await ethers.getContractFactory("LPtoken");
  const roleContract = await ethers.getContractFactory("RoleContract");
  const usd = await ethers.getContractFactory("UnitedSD");

  const transferHelper = await transfers.deploy();
  await transferHelper.deployed();
  console.log(`TransferHelper deployed to ${transferHelper.address}`);

  const usdToken = await usd.deploy();
  await usdToken.deployed();
  console.log(`USD deployed to ${usdToken.address}`);

  const roles = await roleContract.deploy();
  await roles.deployed();
  console.log(`RoleContract deployed to ${roles.address}`);

  const LP = await lpToken.deploy("testing", "tst", manager);
  await LP.deployed();
  console.log(`LPtoken deployed to ${LP.address}`);

  const invest = await investPool.deploy(
    LP.address,
    roles.address,
    usdToken.address,
    fundrisingWallet.address,
    5,
    price,
    utils.parseEther("1200"),
    manager,
    [
      {
        roleNumber: 0,
        startTime: 1689410977337,
        deadline: 1689410979337,
        roleFee: 20,
        maxAmountToSellForRole: utils.parseEther("100"),
      },
      {
        roleNumber: 1,
        startTime: 1689410976437,
        deadline: 1689410977337,
        roleFee: 10,
        maxAmountToSellForRole: utils.parseEther("600"),
      },
      {
        roleNumber: 2,
        startTime: 1689410976437,
        deadline: 1689410979337,
        roleFee: 0,
        maxAmountToSellForRole: utils.parseEther("1500"),
      },
    ]
  );
  await invest.deployed();
  console.log(`InvestPool deployed to ${invest.address}`);

  await new Promise((resolve) => setTimeout(resolve, 60000));

  await hre.run("verify:verify", {
    address: transferHelper,
    contract: "contracts/TransferHelper.sol:TransferHelper",
  });

  await hre.run("verify:verify", {
    address: usdToken,
    contract: "contracts/usd.sol:UnitedSD",
  });

  await hre.run("verify:verify", {
    address: roles,
    contract: "contracts/RoleContract.sol:RoleContract",
  });

  await hre.run("verify:verify", {
    address: LP,
    constructorArguments: ["testing", "tst", manager],
    contract: "contracts/LPtoken.sol:LPtoken",
  });

  await hre.run("verify:verify", {
    address: invest.address,
    constructorArguments: [
      LP.address,
      roles.address,
      usdToken.address,
      fundrisingWallet.address,
      5,
      price,
      utils.parseEther("1200"),
      manager,
      [
        {
          roleNumber: 0,
          startTime: 1689410977337,
          deadline: 1689410979337,
          roleFee: 20,
          maxAmountToSellForRole: utils.parseEther("100"),
        },
        {
          roleNumber: 1,
          startTime: 1689410976437,
          deadline: 1689410977337,
          roleFee: 10,
          maxAmountToSellForRole: utils.parseEther("600"),
        },
        {
          roleNumber: 2,
          startTime: 1689410976437,
          deadline: 1689410979337,
          roleFee: 0,
          maxAmountToSellForRole: utils.parseEther("1500"),
        },
      ],
    ],
    contract: "contracts/investPool.sol:InvestPool",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
