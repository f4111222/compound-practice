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

  // Deploy CEther 
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

   // Deploy oracle
   const Oracle = await hre.ethers.getContractFactory("SimplePriceOracle");
   const oracle = await Oracle.deploy();
   await oracle.deployed();
     
   console.log("Oracle deployed to:", oracle.address);
     
   // Set oracle
  await comptroller._setPriceOracle(oracle.address);
  await oracle.setDirectPrice(cEther.address, 20000);

  // Support CEther in componud  
  await comptroller._supportMarket(cEther.address);
  // Enter markets
  await comptroller.enterMarkets([cEther.address]);
  // Set Collateral Factor
  await comptroller._setCollateralFactor(cEther.address, ethers.utils.parseEther("1"));
  

  //Start to test mint/redeem/borrow/repay

  await cEther.mint({ value: BigNumber.from(1).mul(10 ** 8) });
  balance = await cEther.balanceOf(deployer.address);
  console.log('Supply cEther :', balance.toString());

  await cEther.borrow(BigNumber.from(2).mul(10 ** 5));
  balance = await cEther.balanceOf(deployer.address);
  console.log('cEther balance after borrowing', balance.toString());

  await cEther.redeem(BigNumber.from(2).mul(10 ** 6));
  balance = await cEther.balanceOf(deployer.address);
  console.log('cEther balance after redeem', balance.toString());

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
