
const READ_ACCESS_KEY = '$2b$10$SEZhOctEjFSSELyoTt3YReAC1UwE6eAlgJVMwltKH3k0dpgaweBz6';

const POOL_ADDRESSES_JSON_URL = "https://api.jsonbin.io/v3/b/6311eaeae13e6063dc97f3b4";

const MARGIN_ENGINE_JSON_URL = "https://api.jsonbin.io/v3/b/6311ea005c146d63ca8b68ed";
const VAMM_JSON_URL = "https://api.jsonbin.io/v3/b/6311ea28a1610e63861b13a3";

const AAVE_RATE_ORACLE_JSON_URL = "https://api.jsonbin.io/v3/b/63124c90a1610e63861b80af";
const AAVE_LENDING_POOL_JSON_URL = "https://api.jsonbin.io/v3/b/63124c64e13e6063dc9860ea";

const COMPOUND_RATE_ORACLE_JSON_URL = "https://api.jsonbin.io/v3/b/63124cb1a1610e63861b80d2";
const CTOKEN_JSON_URL = "https://api.jsonbin.io/v3/b/63124c1fe13e6063dc98609c";

const LIDO_RATE_ORACLE_JSON_URL = "https://api.jsonbin.io/v3/b/63124ccc5c146d63ca8bd76a";

const ROCKET_RATE_ORACLE_JSON_URL = "https://api.jsonbin.io/v3/b/63124ce45c146d63ca8bd785";

const updateRates = async (pools) => {
    const provider = new ethers.providers.Web3Provider(ethereum);

    console.log("provider", provider);

    // LOAD ABIs

    await $.ajaxSetup({
        headers: {
            'X-ACCESS-KEY': READ_ACCESS_KEY
        }
    });

    let poolAddresses;
    await $.getJSON(POOL_ADDRESSES_JSON_URL, function (data) {
        poolAddresses = data.record;
        console.log("Pool addresses:", poolAddresses);
    });

    let marginEngineABI;
    await $.getJSON(MARGIN_ENGINE_JSON_URL, function (data) {
        marginEngineABI = data.record.abi;
        console.log("margin engine ABI:", marginEngineABI);
    });

    let vammABI;
    await $.getJSON(VAMM_JSON_URL, function (data) {
        vammABI = data.record.abi;
        console.log("vamm ABI:", vammABI);
    });

    let aaveRateOracleABI;
    await $.getJSON(AAVE_RATE_ORACLE_JSON_URL, function (data) {
        aaveRateOracleABI = data.record.abi;
        console.log("aave ro ABI:", aaveRateOracleABI);
    });

    let aaveLendingPoolABI;
    await $.getJSON(AAVE_LENDING_POOL_JSON_URL, function (data) {
        aaveLendingPoolABI = data.record.abi;
        console.log("aave lending pool ABI:", aaveLendingPoolABI);
    });

    let compoundRateOracleABI;
    await $.getJSON(COMPOUND_RATE_ORACLE_JSON_URL, function (data) {
        compoundRateOracleABI = data.record.abi;
        console.log("compound ro ABI:", compoundRateOracleABI);
    });

    let cTokenABI;
    await $.getJSON(CTOKEN_JSON_URL, function (data) {
        cTokenABI = data.record.abi;
        console.log("cToken ABI:", cTokenABI);
    });

    let lidoRateOracleABI;
    await $.getJSON(LIDO_RATE_ORACLE_JSON_URL, function (data) {
        lidoRateOracleABI = data.record.abi;
        console.log("lido ro ABI:", lidoRateOracleABI);
    });

    let rocketRateOracleABI;
    await $.getJSON(ROCKET_RATE_ORACLE_JSON_URL, function (data) {
        rocketRateOracleABI = data.record.abi;
        console.log("rocket ro ABI:", rocketRateOracleABI);
    });
    
    // iterate through pools and get rates

    for (let pool of pools) {
        console.log("pool:", pool);
        const poolInfo = poolAddresses[pool];
        console.log("poolInfo:", poolInfo);

        const marginEngineAddress = poolInfo.marginEngine;
        console.log("margin engine address:", marginEngineAddress);

        const marginEngineContract = new ethers.Contract(
            marginEngineAddress,
            marginEngineABI,
            provider
        );

        console.log("margin engine contract:", marginEngineContract);

        const vammAddress = await marginEngineContract.vamm();
        console.log("vamm address:", vammAddress);

        const vammContract = new ethers.Contract(
            vammAddress,
            vammABI,
            provider
        );

        console.log("vamm contract:", vammContract);

        const vammVars = await vammContract.vammVars();
        console.log("vamm vars:", vammVars);

        const tick = vammVars[1];
        console.log("vamm tick:", tick);

        const fixedRate = 1.0001 ** (-tick);
        console.log("fixed rate:", fixedRate);

        document.getElementById(`${pool}_fixed_rate`).innerHTML = fixedRate.toFixed(2) + "%";

        const rateOracleAddress = await marginEngineContract.rateOracle();
        console.log("rate oracle address:", rateOracleAddress);

        switch (poolInfo.rateOracleID) {
            case 1: {
                const underlyingTokenAddress = await marginEngineContract.underlyingToken();
                console.log("underlying address:", underlyingTokenAddress);

                const rateOracleContract = new ethers.Contract(
                    rateOracleAddress,
                    aaveRateOracleABI,
                    provider
                );

                const lendingPoolAddress = await rateOracleContract.aaveLendingPool();
                console.log("lending pool address:", lendingPoolAddress);

                const lendingPoolContract = new ethers.Contract(
                    lendingPoolAddress,
                    aaveLendingPoolABI,
                    provider
                );

                const reservesData = await lendingPoolContract.getReserveData(underlyingTokenAddress);
                console.log("reserves data:", reservesData);

                const rateInRay = reservesData.currentLiquidityRate;
                const variableRate = rateInRay.div(BigNumber.from(10).pow(21)).toNumber() / 1000000;

                document.getElementById(`${pool}_variable_rate`).innerHTML = (variableRate * 100).toFixed(2) + "%";
                break;
            }
            case 2: {


                const rateOracleContract = new ethers.Contract(
                    rateOracleAddress,
                    compoundRateOracleABI,
                    provider
                );

                const cTokenAddress = await rateOracleContract.ctoken();
                console.log("cToken address:", cTokenAddress);

                const cTokenContract = new ethers.Contract(
                    cTokenAddress,
                    cTokenABI,
                    provider
                );

                const supplyRatePerBlock = await cTokenContract.supplyRatePerBlock();
                console.log("supply rate per block:", supplyRatePerBlock);

                const variableRate = (((Math.pow((supplyRatePerBlock.toNumber() / 1e18 * blocksPerDay) + 1, 365))) - 1);

                document.getElementById(`${pool}_variable_rate`).innerHTML = (variableRate * 100).toFixed(2) + "%";
                break;
            }
            case 3: {
                const lastBlock = await provider.getBlockNumber();
                const to = BigNumber.from((await provider.getBlock(lastBlock - 1)).timestamp);
                const from = BigNumber.from((await provider.getBlock(lastBlock - 28 * blockPerHour)).timestamp);

                const rateOracleContract = new ethers.Contract(
                    rateOracleAddress,
                    lidoRateOracleABI,
                    provider
                );

                const oneWeekApy = await rateOracleContract.getApyFromTo(from, to);

                const variableRate = oneWeekApy.div(BigNumber.from(1000000000000)).toNumber() / 1000000;

                document.getElementById(`${pool}_variable_rate`).innerHTML = (variableRate * 100).toFixed(2) + "%";
                break;
            }
            case 4: {
                const lastBlock = await provider.getBlockNumber();
                const to = BigNumber.from((await provider.getBlock(lastBlock - 1)).timestamp);
                const from = BigNumber.from((await provider.getBlock(lastBlock - 28 * blockPerHour)).timestamp);

                const rateOracleContract = new ethers.Contract(
                    rateOracleAddress,
                    rocketRateOracleABI,
                    provider
                );

                const oneWeekApy = await rateOracleContract.getApyFromTo(from, to);

                const variableRate = oneWeekApy.div(BigNumber.from(1000000000000)).toNumber() / 1000000;

                document.getElementById(`${pool}_variable_rate`).innerHTML = (variableRate * 100).toFixed(2) + "%";
                break;
            }
            case 5: {
                const underlyingTokenAddress = await marginEngineContract.underlyingToken();
                console.log("underlying address:", underlyingTokenAddress);

                const rateOracleContract = new ethers.Contract(
                    rateOracleAddress,
                    aaveRateOracleABI,
                    provider
                );

                const lendingPoolAddress = await rateOracleContract.aaveLendingPool();
                console.log("lending pool address:", lendingPoolAddress);

                const lendingPoolContract = new ethers.Contract(
                    lendingPoolAddress,
                    aaveLendingPoolABI,
                    provider
                );

                const reservesData = await lendingPoolContract.getReserveData(underlyingTokenAddress);
                console.log("reserves data:", reservesData);

                const rateInRay = reservesData.currentVariableBorrowRate;
                const variableRate = rateInRay.div(BigNumber.from(10).pow(21)).toNumber() / 1000000;

                document.getElementById(`${pool}_variable_rate`).innerHTML = (variableRate * 100).toFixed(2) + "%";
                break;
            }
            case 6: {
                const rateOracleContract = new ethers.Contract(
                    rateOracleAddress,
                    compoundRateOracleABI,
                    provider
                );

                const cTokenAddress = await rateOracleContract.ctoken();
                console.log("cToken address:", cTokenAddress);

                const cTokenContract = new ethers.Contract(
                    cTokenAddress,
                    cTokenABI,
                    provider
                );

                const borrowRatePerBlock = await cTokenContract.borrowRatePerBlock();
                console.log("borrow rate:", borrowRatePerBlock);

                const variableRate = (((Math.pow((borrowRatePerBlock.toNumber() / 1e18 * blocksPerDay) + 1, 365))) - 1);

                document.getElementById(`${pool}_variable_rate`).innerHTML = (variableRate * 100).toFixed(2) + "%";
                break;
            }
            default: {
                document.getElementById(`${pool}_variable_rate`).innerHTML = "-";
            }
        }
    }
}
