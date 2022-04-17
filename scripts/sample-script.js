// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const {ethers} = require("hardhat");
const { BigNumber } = ethers;

async function main() {

  //get deployer address
  const deployer = (await ethers.getSigners())[0];

  // deploy comptroller
  const Comptroller = await hre.ethers.getContractFactory("ComptrollerG1");
  const comptroller = await Comptroller.deploy();
  await comptroller.deployed();

  console.log("Comptroller deployed to:", comptroller.address);

  // deploy interest rate model
  const Interestrate = await hre.ethers.getContractFactory("JumpRateModel");
  const interestrate = await Interestrate.deploy(1,1,1,1);
  await interestrate.deployed();

  console.log("Interestrate deployed to:", interestrate.address);

  // Deploy oracle
  const Oracle = await hre.ethers.getContractFactory("SimplePriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.deployed();
    
  console.log("Oracle deployed to:", oracle.address);
    
  // Set oracle
  await comptroller._setPriceOracle(oracle.address);

  // Deploy test CEther 
  const CEther = await ethers.getContractFactory("CEther");
  const cEther = await CEther.deploy(
    comptroller.address, 
    interestrate.address,
    1,
    'CEther',
    'cETH',
    18,
    deployer.address
  );
  await cEther.deployed();  

  console.log('CEther deployed to:', cEther.address);

  await oracle.setUnderlyingPrice(cEther.address, 100)
  
  await comptroller._supportMarket(cEther.address);
  await comptroller._setCollateralFactor(cEther.address,  ethers.utils.parseEther("10"));

  // deploy JToken 
  const TestToken = await hre.ethers.getContractFactory("JToken");
  const testToken = await TestToken.deploy(ethers.utils.parseEther("5000"));
  await testToken.deployed();
 
  console.log("Testtoken deployed to:", testToken.address);

  const CErc20 = await ethers.getContractFactory('CErc20');
  const cTestCoin = await CErc20.deploy(
    testToken.address,
    comptroller.address,
    interestrate.address,
    '1',
    "CJackyToken", 
    "CJT", 
    8
  );
  await cTestCoin.deployed();
  console.log('cTestCoin deployed to:', cTestCoin.address);

  await oracle.setUnderlyingPrice(cTestCoin.address, 100)
  await comptroller._supportMarket(cTestCoin.address);
  await comptroller._setCollateralFactor(cTestCoin.address, ethers.utils.parseEther("1"));
  

  //EnterMarkets
  await comptroller.enterMarkets([cEther.address, cTestCoin.address]);


  await testToken.approve(cTestCoin.address, 100000000000);
  await cTestCoin.mint(1000);

  console.log('Supply cEther');
  await cEther.mint({ value:  ethers.utils.parseEther("1") });

  balance = await cEther.balanceOf(admin.address);
  console.log('cEther balance', balance.toString());

    
  console.log('Supply cTestCoin');
  await testCoin.approve(cTestCoin.address, ethers.utils.parseEther("10"));
  await cTestCoin.mint(1000);
  balance = await cTestCoin.balanceOf(admin.address);
  console.log('cTestCoin balance', balance.toString());

  balance = await testCoin.balanceOf(admin.address);
  console.log('TestCoin balance before borrowing', balance.toString());
  await cTestCoin.borrow(1000);
  balance = await testCoin.balanceOf(admin.address);
  console.log('TestCoin balance after borrowing', balance.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
