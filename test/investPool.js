const { expect } = require("chai");
const { utils } = require("ethers");
const { ethers, upgrades } = require("hardhat");


describe("Invest Pool init example", function () {
    let owner, signer, manager, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10;
    let investPool, roleContract, usd, lpToken;

    let price = 110; // 1.1$

    const airDropUSD = async (user, amount) => {
        let _amount = utils.parseEther(amount.toString())
        await usd.mint(user.address, _amount)
        expect(await usd.balanceOf(user.address)).to.equal(_amount)
    }

    const givaAllAprroves = async (user, amount) => {
        await usd.connect(user).approve(investPool.address, amount)
        expect(await usd.allowance(user.address, investPool.address)).to.equal(amount)
    }

    before(async () => {
        [owner, signer, manager, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10] = await ethers.getSigners();
        let users = [user1, user2, user3, user4, user5, user6, user7, user8, user9, user10]
        let fundrisingWallet = await ethers.Wallet.createRandom()

        const USD = await ethers.getContractFactory("usd");
        usd = await USD.deploy();
        await usd.deployed();

        const LPToken = await ethers.getContractFactory("contracts/LPtoken.sol:LPtoken");
        lpToken = await LPToken.deploy("testing", "tst", manager.address);

        const Roles = await ethers.getContractFactory("RoleContract");
        roleContract = await upgrades.deployProxy(Roles, [signer.address, manager.address, [
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
            }
        ]]);

        const InvestPool = await ethers.getContractFactory("contracts/InvestPool.sol:InvestPool");
        investPool = await InvestPool.deploy(lpToken.address, roleContract.address, usd.address, fundrisingWallet.address, 5, price, utils.parseEther("1200"), manager.address,
            [
                {
                    roleNumber: 0,
                    startTime: Math.floor(Date.now() / 1000) + 1000,
                    deadline: Math.floor(Date.now() / 1000) + 3000,
                    roleFee: 20,
                    maxAmountToSellForRole: utils.parseEther("100")
                },
                {
                    roleNumber: 1,
                    startTime: Math.floor(Date.now() / 1000) + 50,
                    deadline: Math.floor(Date.now() / 1000) + 1000,
                    roleFee: 10,
                    maxAmountToSellForRole: utils.parseEther("600")
                },
                {
                    roleNumber: 2,
                    startTime: Math.floor(Date.now() / 1000) + 50,
                    deadline: Math.floor(Date.now() / 1000) + 3000,
                    roleFee: 0,
                    maxAmountToSellForRole: utils.parseEther("1500")
                },
            ]
        );
        await investPool.deployed();

        {
            await lpToken.mint(investPool.address, utils.parseEther("2700"))
        }

        for (let i = 0; i < users.length; i++) {
            await airDropUSD(users[i], 1000000)
            await givaAllAprroves(users[i], utils.parseEther("100000000000000000000"))
        }

    });

    /// Start tests here

})