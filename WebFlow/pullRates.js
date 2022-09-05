const MARGIN_ENGINE_ABI = {
    "abi": [
        {
            "inputs": [],
            "name": "rateOracle",
            "outputs": [
                {
                    "internalType": "contract IRateOracle",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "underlyingToken",
            "outputs": [
                {
                    "internalType": "contract IERC20Minimal",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "vamm",
            "outputs": [
                {
                    "internalType": "contract IVAMM",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
}

const VAMM_ABI = {
    "abi": [
        {
            "inputs": [],
            "name": "vammVars",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint160",
                            "name": "sqrtPriceX96",
                            "type": "uint160"
                        },
                        {
                            "internalType": "int24",
                            "name": "tick",
                            "type": "int24"
                        },
                        {
                            "internalType": "uint8",
                            "name": "feeProtocol",
                            "type": "uint8"
                        }
                    ],
                    "internalType": "struct IVAMM.VAMMVars",
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
}

const RATE_ORACLE_ABI = {
    "abi": [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "from",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "to",
                    "type": "uint256"
                }
            ],
            "name": "getApyFromTo",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "apyFromToWad",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "ctoken",
            "outputs": [
                {
                    "internalType": "contract ICToken",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "aaveLendingPool",
            "outputs": [
                {
                    "internalType": "contract IAaveV2LendingPool",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
}

const AAVE_LENDING_POOL_ABI = {
    "abi": [{ "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }], "name": "getReserveData", "outputs": [{ "components": [{ "components": [{ "internalType": "uint256", "name": "data", "type": "uint256" }], "internalType": "struct DataTypes.ReserveConfigurationMap", "name": "configuration", "type": "tuple" }, { "internalType": "uint128", "name": "liquidityIndex", "type": "uint128" }, { "internalType": "uint128", "name": "variableBorrowIndex", "type": "uint128" }, { "internalType": "uint128", "name": "currentLiquidityRate", "type": "uint128" }, { "internalType": "uint128", "name": "currentVariableBorrowRate", "type": "uint128" }, { "internalType": "uint128", "name": "currentStableBorrowRate", "type": "uint128" }, { "internalType": "uint40", "name": "lastUpdateTimestamp", "type": "uint40" }, { "internalType": "address", "name": "aTokenAddress", "type": "address" }, { "internalType": "address", "name": "stableDebtTokenAddress", "type": "address" }, { "internalType": "address", "name": "variableDebtTokenAddress", "type": "address" }, { "internalType": "address", "name": "interestRateStrategyAddress", "type": "address" }, { "internalType": "uint8", "name": "id", "type": "uint8" }], "internalType": "struct DataTypes.ReserveData", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }]
}

const CTOKEN_ABI = {
    "abi": [
        { "constant": true, "inputs": [], "name": "borrowRatePerBlock", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" },
        { "constant": true, "inputs": [], "name": "supplyRatePerBlock", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }
    ]
}

const daysPerYear = 365;
const blocksPerDay = 6570; // 13.15 seconds per block
const blocksPerHour = 274;

const updateRates = async (pool, poolAddresses) => {
    const { ethereum } = window;

    if (!ethereum) {
        document.getElementById(`${pool}_fixed_rate`).innerHTML = "-";
        document.getElementById(`${pool}_fixed_rate_2`).innerHTML = "-";
        document.getElementById(`${pool}_fixed_rate_3`).innerHTML = "-";
        document.getElementById(`${pool}_fixed_rate_4`).innerHTML = "-";

        document.getElementById(`${pool}_variable_rate`).innerHTML = "-";
        document.getElementById(`${pool}_variable_rate_2`).innerHTML = "-";
        document.getElementById(`${pool}_variable_rate_3`).innerHTML = "-";
        document.getElementById(`${pool}_variable_rate_4`).innerHTML = "-";

        return;
    }

    const provider = new ethers.providers.Web3Provider(ethereum);

    console.log("provider", provider);

    console.log("pool:", pool);
    const poolInfo = poolAddresses[pool];
    console.log("poolInfo:", poolInfo);

    const marginEngineAddress = poolInfo.marginEngine;
    console.log("margin engine address:", marginEngineAddress);

    const marginEngineContract = new ethers.Contract(
        marginEngineAddress,
        MARGIN_ENGINE_ABI.abi,
        provider
    );

    console.log("margin engine contract:", marginEngineContract);

    const vammAddress = await marginEngineContract.vamm();
    console.log("vamm address:", vammAddress);

    const vammContract = new ethers.Contract(
        vammAddress,
        VAMM_ABI.abi,
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
    document.getElementById(`${pool}_fixed_rate_2`).innerHTML = fixedRate.toFixed(2) + "%";
    document.getElementById(`${pool}_fixed_rate_3`).innerHTML = fixedRate.toFixed(2) + "%";
    document.getElementById(`${pool}_fixed_rate_4`).innerHTML = fixedRate.toFixed(2) + "%";

    const rateOracleAddress = await marginEngineContract.rateOracle();
    console.log("rate oracle address:", rateOracleAddress);

    let variableRateString;
    switch (poolInfo.rateOracleID) {
        case 1: {
            const underlyingTokenAddress = await marginEngineContract.underlyingToken();
            console.log("underlying address:", underlyingTokenAddress);

            const rateOracleContract = new ethers.Contract(
                rateOracleAddress,
                RATE_ORACLE_ABI.abi,
                provider
            );

            const lendingPoolAddress = await rateOracleContract.aaveLendingPool();
            console.log("lending pool address:", lendingPoolAddress);

            const lendingPoolContract = new ethers.Contract(
                lendingPoolAddress,
                AAVE_LENDING_POOL_ABI.abi,
                provider
            );

            const reservesData = await lendingPoolContract.getReserveData(underlyingTokenAddress);
            console.log("reserves data:", reservesData);

            const rateInRay = reservesData.currentLiquidityRate;
            const variableRate = Number(ethers.utils.formatUnits(rateInRay, 27));

            variableRateString = (variableRate * 100).toFixed(2) + "%";
            break;
        }
        case 2: {
            const rateOracleContract = new ethers.Contract(
                rateOracleAddress,
                RATE_ORACLE_ABI.abi,
                provider
            );

            const cTokenAddress = await rateOracleContract.ctoken();
            console.log("cToken address:", cTokenAddress);

            const cTokenContract = new ethers.Contract(
                cTokenAddress,
                CTOKEN_ABI.abi,
                provider
            );

            const supplyRatePerBlock = await cTokenContract.supplyRatePerBlock();
            console.log("supply rate per block:", supplyRatePerBlock);

            const variableRate = (((Math.pow((Number(ethers.utils.formatUnits(supplyRatePerBlock, 18)) * blocksPerDay) + 1, daysPerYear))) - 1);

            variableRateString = (variableRate * 100).toFixed(2) + "%";
            break;
        }
        case 3: {
            const lastBlock = await provider.getBlockNumber();
            const to = (await provider.getBlock(lastBlock - 1)).timestamp;
            const from = (await provider.getBlock(lastBlock - 28 * blocksPerHour)).timestamp;

            const rateOracleContract = new ethers.Contract(
                rateOracleAddress,
                RATE_ORACLE_ABI.abi,
                provider
            );

            const oneWeekApy = await rateOracleContract.getApyFromTo(from, to);

            const variableRate = ethers.utils.formatUnits(oneWeekApy, 18);

            variableRateString = (variableRate * 100).toFixed(2) + "%";
            break;
        }
        case 4: {
            const lastBlock = await provider.getBlockNumber();
            const to = (await provider.getBlock(lastBlock - 1)).timestamp;
            const from = (await provider.getBlock(lastBlock - 28 * blocksPerHour)).timestamp;

            const rateOracleContract = new ethers.Contract(
                rateOracleAddress,
                RATE_ORACLE_ABI.abi,
                provider
            );

            const oneWeekApy = await rateOracleContract.getApyFromTo(from, to);

            const variableRate = ethers.utils.formatUnits(oneWeekApy, 18);

            variableRateString = (variableRate * 100).toFixed(2) + "%";
            break;
        }
        case 5: {
            const underlyingTokenAddress = await marginEngineContract.underlyingToken();
            console.log("underlying address:", underlyingTokenAddress);

            const rateOracleContract = new ethers.Contract(
                rateOracleAddress,
                RATE_ORACLE_ABI.abi,
                provider
            );

            const lendingPoolAddress = await rateOracleContract.aaveLendingPool();
            console.log("lending pool address:", lendingPoolAddress);

            const lendingPoolContract = new ethers.Contract(
                lendingPoolAddress,
                AAVE_LENDING_POOL_ABI.abi,
                provider
            );

            const reservesData = await lendingPoolContract.getReserveData(underlyingTokenAddress);
            console.log("reserves data:", reservesData);

            const rateInRay = reservesData.currentVariableBorrowRate;
            const variableRate = Number(ethers.utils.formatUnits(rateInRay, 27));

            variableRateString = (variableRate * 100).toFixed(2) + "%";
            break;
        }
        case 6: {
            const rateOracleContract = new ethers.Contract(
                rateOracleAddress,
                RATE_ORACLE_ABI.abi,
                provider
            );

            const cTokenAddress = await rateOracleContract.ctoken();
            console.log("cToken address:", cTokenAddress);

            const cTokenContract = new ethers.Contract(
                cTokenAddress,
                CTOKEN_ABI.abi,
                provider
            );

            const borrowRatePerBlock = await cTokenContract.borrowRatePerBlock();
            console.log("borrow rate:", borrowRatePerBlock);

            const variableRate = (((Math.pow((Number(ethers.utils.formatUnits(borrowRatePerBlock, 18)) * blocksPerDay) + 1, daysPerYear))) - 1);

            variableRateString = (variableRate * 100).toFixed(2) + "%";
            break;
        }
        default: {
            variableRateString = "-";
        }
    }
    
    document.getElementById(`${pool}_variable_rate`).innerHTML = variableRateString;
    document.getElementById(`${pool}_variable_rate_2`).innerHTML = variableRateString;
    document.getElementById(`${pool}_variable_rate_3`).innerHTML = variableRateString;
    document.getElementById(`${pool}_variable_rate_4`).innerHTML = variableRateString;
}

