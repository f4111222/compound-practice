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

  // deploy Testcoin: JToken
  const Testcoin = await ethers.getContractFactory("JToken");
  const testcoin = await Testcoin.deploy();
  await testcoin.deployed();  

  console.log('Testcoin: JToken deployed to:', testcoin.address);

  // deploy cERC20 Delegate
  const CErc20DelegateFactory = await ethers.getContractFactory('CErc20Delegate');
  cErc20DelegateContract = await CErc20DelegateFactory.deploy();
  await cErc20DelegateContract.deployed();
  
  console.log('CErc20DelegateContract deployed to:', cErc20DelegateContract.address);

  // deploy cERC20
  const CErc20 = await ethers.getContractFactory('CErc20Delegator');
  cErc20 = await CErc20.deploy(
    testErc20Contract.address,
    comptrollerContract.address,
    interestRateModelContract.address,
    ethers.utils.parseUnits('1', 18),
    '',
    'cErc20',
    1,
    deployer.address,
    cErc20DelegateContract.address,
    []
  );
  await cerc20.deployed();

  console.log('CErc20 to:', cErc20.address);

  // deploy cETH
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


  // deploy oracle
  const Oracle = await hre.ethers.getContractFactory("SimplePriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.deployed();
     
  console.log("Oracle deployed to:", oracle.address);
  

  // Support CEther in componud  
  await comptroller._supportMarket(cEther.address);
  await comptroller._supportMarket(cErc20.address);

  await Testcoin.approve(cErc20.address, ethers.utils.parseUnits('100000', 18));
  await Testcoin.connect(borrower).approve(cErc20.address, ethers.utils.parseUnits('100000', 18));


  // Set oracle & origin JToken price to 10
  await oracle.setDirectPrice(cEther.address, ethers.utils.parseUnits('10', 18));
  await comptroller._setPriceOracle(oracle.address);

  // Set Collateral Factor
  await comptroller._setCollateralFactor(cEther.address, ethers.utils.parseEther("1"));
  await comptroller._setCollateralFactor(cErc20.address, ethers.utils.parseEther("1"));

/*
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
*/

  let borrower;
  // Start to test liquidate
  // provide 100 JToken
  await cErc20.mint(ethers.utils.parseUnits('100', 18));
    
  // borrower provide 100 cETH
  await cEther.connect(borrower).mint({ value: ethers.utils.parseUnits('100', 18) });
  
  // borrower Enter markets
  await comptroller.connect(borrower).enterMarkets([cEther.address]);

  // borrower lend 10000 JToken
  await cErc20.connect(borrower).borrow(ethers.utils.parseUnits('10000', 18));

  //set new JToken price to 50000
  await priceOracleContract.setDirectPrice(Testcoin.address, ethers.utils.parseUnits('50000', 18));

  //liquidate borrower
  await cErc20.liquidateBorrow(borrower.address, ethers.utils.parseUnits('10000', 18), cEther.address);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
