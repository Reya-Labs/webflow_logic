
const READ_ACCESS_KEY = '$2b$10$SEZhOctEjFSSELyoTt3YReAC1UwE6eAlgJVMwltKH3k0dpgaweBz6';

const POOL_ADDRESSES_JSON_URL = "https://api.jsonbin.io/v3/b/6311eaeae13e6063dc97f3b4";
const MARGIN_ENGINE_JSON_URL = "https://api.jsonbin.io/v3/b/6311ea005c146d63ca8b68ed";
const VAMM_JSON_URL = "https://api.jsonbin.io/v3/b/6311ea28a1610e63861b13a3";

const updateRates = async(pools) => {    
    let marginEngineABI;
    let vammABI;
    let poolAddresses;

    await $.ajaxSetup({
        headers: {
            'X-ACCESS-KEY': READ_ACCESS_KEY
        }
    });

    await $.getJSON(POOL_ADDRESSES_JSON_URL, function (data) {
        poolAddresses = data.record;
        console.log("Pool addresses:", poolAddresses);
    });

    await $.getJSON(MARGIN_ENGINE_JSON_URL, function (data) {
        marginEngineABI = data.record;
        console.log("margin engine ABI:", marginEngineABI);
    });

    await $.getJSON(VAMM_JSON_URL, function (data) {
        vammABI = data.record;
        console.log("vamm ABI:", vammABI);
    });

    for (let pool in pools) {
        console.log("pool:", pool);
        const poolInfo = poolAddresses[pool];
        console.log("poolInfo:", poolInfo);

        const marginEngineContract = new ethers.Contract(
            marginEngineABI,
            poolInfo.marginEngine
        );

        const vammAddress = await marginEngineContract.vamm();
        console.log("vamm address:", vammAddress);

        const vammContract = new ethers.Contract(
            marginEngineABI,
            marginEngineAddress
        );

        const tick = (await vammContract.vammVars())[1];
        console.log("vamm tick:", tick);

        const fixedRate = 1.0001 ** (-tick);
        console.log("fixedRate:", fixedRate);

        document.getElementById(`${pool}_fixed_rate`).innerHTML = fixedRate.toFixed(2) + "%";
        document.getElementById(`${pool}_variable_rate`).innerHTML = "x%";
    }
}

// const getVariableRate = async (web3, pool) => {
//     console.log("window", window);

//     await $.ajaxSetup({
//         headers : {   
//           'X-ACCESS-KEY' : READ_ACCESS_KEY
//         }
//       });

//     await $.getJSON(MARGIN_ENGINE_JSON_URL, function (data) {
//       marginEngineABI = data;
//       console.log("margin engine ABI:", marginEngineABI);
//     });

//     const poolInfo = poolAddresses[pool];

//     const marginEngineContract = new web3.eth.Contract(
//         marginEngineABI,
//         poolInfo.marginEngine
//     );

//     const rateOracleAddress = await marginEngineContract.rateOracle();

//     switch (poolInfo.rateOracleID) {
//         case 1: {
//             const underlyingTokenAddress = await marginEngineContract.underlyingToken();
//             const variableRate = await pullAaveLendingRate(web3, rateOracleAddress, underlyingTokenAddress);
//             return (variableRate * 100).toFixed(2) + "%";
//         }
//         case 2: {
//             const variableRate = await pullCompoundBorrowingRate(web3, rateOracleAddress);
//             return (variableRate * 100).toFixed(2) + "%";
//         }
//         case 3: {
//             const variableRate = await pullLidoRate(web3, rateOracleAddress);
//             return (variableRate * 100).toFixed(2) + "%";
//         }
//         case 4: {
//             const variableRate = await pullAaveLendingRate(web3, rateOracleAddress);
//             return (variableRate * 100).toFixed(2) + "%";
//         }
//         case 5: {
//             const underlyingTokenAddress = await marginEngineContract.underlyingToken();
//             const variableRate = await pullAaveLendingRate(web3, rateOracleAddress, underlyingTokenAddress);
//             return (variableRate * 100).toFixed(2) + "%";
//         }
//         case 6: {
//             const variableRate = await pullAaveLendingRate(web3, rateOracleAddress);
//             return (variableRate * 100).toFixed(2) + "%";
//         }
//         default: {
//             return "-";
//         }
//     }
// }

// // ID 1
// const pullAaveLendingRate = async (web3, rateOracleAddress, underlyingTokenAddress) => {
//     const rateOracleContract = new web3.eth.Contract(
//         AaveLendingRateOracleABI,
//         rateOracleAddress
//     );

//     const lendingPoolAddress = await rateOracleContract.aaveLendingPool();

//     const lendingPoolContract = new web3.eth.Contract(
//         AaveLendingPoolABI,
//         lendingPoolAddress
//     );

//     const reservesData = await lendingPoolContract.getReserveData(underlyingTokenAddress);
//     const rateInRay = reservesData.currentLiquidityRate;
//     const result = rateInRay.div(BigNumber.from(10).pow(21)).toNumber() / 1000000;
//     return result;
// }

// // ID 2
// const pullCompoundLendingRate = async (web3, rateOracleAddress) => {
//     const daysPerYear = 365;

//     const rateOracleContract = new web3.eth.Contract(
//         CompoundLendingRateOracleABI,
//         rateOracleAddress
//     );

//     const cTokenAddress = await rateOracleContract.ctoken();

//     const cTokenContract = new web3.eth.Contract(
//         cTokenABI,
//         cTokenAddress
//     );

//     const supplyRatePerBlock = await cTokenContract.supplyRatePerBlock();
//     const supplyApy = (((Math.pow((supplyRatePerBlock.toNumber() / 1e18 * blocksPerDay) + 1, daysPerYear))) - 1);
//     return supplyApy;
// }

// // ID 3
// const pullLidoRate = async (web3, rateOracleAddress) => {
//     const provider = web3.currentProvider;
//     console.log("provider:", provider);

//     const lastBlock = await provider.getBlockNumber();
//     const to = BigNumber.from((await provider.getBlock(lastBlock - 1)).timestamp);
//     const from = BigNumber.from((await provider.getBlock(lastBlock - 28 * blockPerHour)).timestamp);

//     const rateOracleContract = new web3.eth.Contract(
//         CompoundLendingRateOracleABI,
//         rateOracleAddress
//     );

//     const oneWeekApy = await rateOracleContract.getApyFromTo(from, to);

//     return oneWeekApy.div(BigNumber.from(1000000000000)).toNumber() / 1000000;
// }

// // ID 4
// const pullRocketRate = async (web3, rateOracleAddress) => {
//     const provider = web3.currentProvider;
//     console.log("provider:", provider);

//     const lastBlock = await this.provider.getBlockNumber();
//     const to = BigNumber.from((await this.provider.getBlock(lastBlock - 1)).timestamp);
//     const from = BigNumber.from((await this.provider.getBlock(lastBlock - 28 * blockPerHour)).timestamp);

//     const rateOracleContract = new web3.eth.Contract(
//         CompoundLendingRateOracleABI,
//         rateOracleAddress
//     );

//     const oneWeekApy = await rateOracleContract.getApyFromTo(from, to);

//     return oneWeekApy.div(BigNumber.from(1000000000000)).toNumber() / 1000000;
// }

// // ID 5 
// const pullAaveBorrowingRate = async (web3, rateOracleAddress, underlyingTokenAddress) => {
//     const rateOracleContract = new web3.eth.Contract(
//         AaveBorrowingRateOracleABI,
//         rateOracleAddress
//     );

//     const lendingPoolAddress = await rateOracleContract.aaveLendingPool();

//     const lendingPoolContract = new web3.eth.Contract(
//         AaveLendingPoolABI,
//         lendingPoolAddress
//     );

//     const reservesData = await lendingPoolContract.getReserveData(underlyingTokenAddress);
//     const rateInRay = reservesData.currentVariableBorrowRate;
//     const result = rateInRay.div(BigNumber.from(10).pow(21)).toNumber() / 1000000;
//     return result;
// }

// // ID 6
// const pullCompoundBorrowingRate = async (web3, rateOracleAddress) => {
//     const daysPerYear = 365;

//     const rateOracleContract = new web3.eth.Contract(
//         CompoundLendingRateOracleABI,
//         rateOracleAddress
//     );

//     const cTokenAddress = await rateOracleContract.ctoken();

//     const cTokenContract = new web3.eth.Contract(
//         cTokenABI,
//         cTokenAddress
//     );

//     const borrowRatePerBlock = await cTokenContract.borrowRatePerBlock();
//     const borrowApy = (((Math.pow((borrowRatePerBlock.toNumber() / 1e18 * blocksPerDay) + 1, daysPerYear))) - 1);
//     return borrowApy;
// }
