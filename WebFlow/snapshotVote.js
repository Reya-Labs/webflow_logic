const checkIsConnectedMetamask = async () => {
    let isConnected = false;
    try {
        const { ethereum } = window;

        if (!ethereum) {
            console.log("Make sure you have metamask!");
            return;
        } else {
            console.log("We have the ethereum object", ethereum);
        }

        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts.length !== 0) {
            const account = accounts[0];
            console.log("Found an authorized account:", account);
            isConnected = true;
        } else {
            console.log("No authorized account found");
        }
    } catch (error) {
        console.log(error);
    }

    console.log("Metamask connected status:", isConnected);
    return isConnected;
};

const checkIsConnectedWalletConnect = async (web3) => {
    let isConnected = false;

    try {
        if (!web3) {
            console.log("Wallet connect is not connected");
        } else {
            console.log("We have the web3 object", web3);
            const accounts = await web3.eth.getAccounts();
            console.log("accounts ", accounts);
            isConnected = true;
        }
    } catch (error) {
        console.log(error);
    }

    console.log("Wallet connect connected status:", isConnected);
    return isConnected;
};

const connectMetamask = async () => {
    try {
        const { ethereum } = window;
        if (!ethereum) {
            if (
                window.confirm(
                    'Get MetaMask! If you click "ok" you will be redirected to install MetaMask'
                )
            ) {
                window.location.href = "https://metamask.io/";
            }
            return;
        }

        await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
        console.log(error);
    }
};

const connectWalletConnect = async () => {
    try {
        // https://docs.walletconnect.com/quick-start/dapps/web3-provider
        const provider = new WalletConnectProvider.default({
            rpc: {
                1: "https://cloudflare-eth.com/", // https://ethereumnodes.com/
                137: "https://polygon-rpc.com/", // https://docs.polygon.technology/docs/develop/network-details/network/
                // ...
            },
            // bridge: 'https://bridge.walletconnect.org',
        });

        await provider.enable();

        //  Create Web3 instance
        const web3 = new Web3(provider);
        window.w3 = web3;
        await web3.eth.getAccounts(); // get all connected accounts
        // returning web3
        return web3;
    } catch (error) {
        console.log(error);
    }

    return web3;
};

const handleUserConnection = () => {
    console.log("handle user connection", isConnectedMetamask, isConnectedWalletConnect);
    if (isConnectedMetamask || isConnectedWalletConnect) {
        buttonMetamask.hidden = true;
        buttonWalletConnect.hidden = true;
        buttonVoteYes.hidden = false;
        buttonVoteNo.hidden = false;
    } else {
        buttonMetamask.hidden = false;
        buttonWalletConnect.hidden = false;
        buttonVoteYes.hidden = true;
        buttonVoteNo.hidden = true;
    }

    buttonQueue.hidden = true;
    buttonDeploy.hidden = true;
}



const getYesVote = async () => {
    /// retrive the vote of the user from the radio buttons
    const yesVote = await document.getElementById("radio").checked; //  yes radio button has field id 'radio'
    return yesVote;
};

const publishVotingEndDate = async (web3) => {
    const contractAddress = "0x36E3d9E6f22D9E02039FA6ec1CD073216E4D3E8C";
    let contractABI;

    await $.getJSON(
        "https://api.jsonbin.io/b/628527b525069545a33c4b81",
        function (data) {
            // JSON result in `data` variable
            console.log("Community Deployer ABI: ");
            contractABI = data.abi;
        }
    );
    console.log("Community Deployment Contract ABI (end date function): ", contractABI);

    console.log('inside the publishVotingEndDate function');

    const { ethereum } = window;
    let communityDeployerContract;
    if (web3) {
        communityDeployerContract = new web3.eth.Contract(
            contractABI,
            contractAddress
        ); // create instance of the contract to retrieve data from.
    } else if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        communityDeployerContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer);
    } else {
        document.getElementById("voting-end-date").innerHTML = "SOON!";
        return;
    }
    if (web3) {
        console.log('after the community deployer contract instance is created');
        console.log('Community Deployer Contract: ', communityDeployerContract);
        const endDate = await communityDeployerContract.methods.blockTimestampVotingEnd().call();
        console.log('Printing endDate in unix :', parseInt(endDate, 16));
        const dateObject = new Date(endDate * 1000);
        console.log("Printing the dateObject date: ", dateObject);
        console.log("Printing the dateObject in localeString", dateObject.toLocaleString())
        document.getElementById("voting-end-date").innerHTML = dateObject.toLocaleString(); // injects the endDate into the section where it needs to be displayed

    } else {
        console.log('after the community deployer contract instance is created');
        console.log('Community Deployer Contract: ', communityDeployerContract);
        const endDate = await communityDeployerContract.blockTimestampVotingEnd();
        console.log('Printing endDate in unix :', parseInt(endDate, 16));
        const dateObject = new Date(endDate * 1000);
        console.log("Printing the dateObject date: ", dateObject);
        console.log("Printing the dateObject in localeString", dateObject.toLocaleString())
        document.getElementById("voting-end-date").innerHTML = dateObject.toLocaleString(); // injects the endDate into the section where it needs to be displayed

    }


};

const getTimeLockDate = async (web3) => {
    const contractAddress = "0x36E3d9E6f22D9E02039FA6ec1CD073216E4D3E8C";
    let contractABI;

    await $.getJSON(
        "https://api.jsonbin.io/b/628527b525069545a33c4b81",
        function (data) {
            // JSON result in `data` variable
            console.log("Community Deployer ABI inside getTimeLockDate function: ");
            contractABI = data.abi;
        }
    );
    console.log("Community Deployment Contract ABI (getTimeLock function): ", contractABI);

    console.log('inside the getTimeLockDate function');

    const { ethereum } = window;
    let communityDeployerContract;
    if (web3) {
        communityDeployerContract = new web3.eth.Contract(
            contractABI,
            contractAddress
        ); // create instance of the contract to retrieve data from.
    } else if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        communityDeployerContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer);
    } else {
        document.getElementById("timelock-period").innerHTML = "SOON!";
        return;
    }

    if (web3) {
        console.log('after the community deployer contract instance is created');
        console.log('Community Deployer Contract: ', communityDeployerContract);
        const timeLockDate = await communityDeployerContract.methods.blockTimestampVotingEnd().call();
        console.log('Printing endDate in unix :', parseInt(timeLockDate, 16));
        const timeLockDateObject = new Date(timeLockDate * 1000);
        console.log("Printing the timelockDateObject date: ", timeLockDateObject);
        console.log("Printing the timeLockDateObject in localeString", timeLockDateObject.toLocaleString())
        document.getElementById("timelock-period").innerHTML = timeLockDateObject.toLocaleString(); // injects the endDate into the section where it needs to be displayed

    } else {
        console.log('after the community deployer contract instance is created');
        console.log('Community Deployer Contract: ', communityDeployerContract);
        const timeLockDate = await communityDeployerContract.blockTimestampVotingEnd();
        console.log('Printing timeLockDate in unix :', parseInt(timeLockDate, 16));
        const timeLockDateObject = new Date(timeLockDate * 1000);
        console.log("Printing the timeLockDateObject date: ", timeLockDateObject);
        console.log("Printing the timeLockDateObject in localeString", timeLockDateObject.toLocaleString())
        document.getElementById("timelock-period").innerHTML = timeLockDateObject.toLocaleString(); // injects the endDate into the section where it needs to be displayed

    }

}

const voteCounter = async (web3) => {
    const contractAddress = "0x36E3d9E6f22D9E02039FA6ec1CD073216E4D3E8C";
    let contractABI;

    await $.getJSON(
        "https://api.jsonbin.io/b/628527b525069545a33c4b81",
        function (data) {
            // JSON result in `data` variable
            console.log("Community Deployer ABI: ");
            contractABI = data.abi;
        }
    );
    console.log("Community Deployment Contract ABI (end date function): ", contractABI);

    const { ethereum } = window;
    let communityDeployerContract;
    if (web3) {
        communityDeployerContract = new web3.eth.Contract(
            contractABI,
            contractAddress
        ); // create instance of the contract to retrieve data from.
    } else if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        communityDeployerContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer);
    } else {
        return;
    }

    try {
        if (web3) {
            const totalYesCount = await communityDeployerContract.methods.yesVoteCount().call();
            console.log("total yes count boolean: ", totalYesCount);
            const totalNoCount = await communityDeployerContract.methods.noVoteCount().call();
            console.log("total No count boolean: ", totalNoCount);
            // get and display the nr of yes and no votes in the poll below
            document.getElementById("nr-yes-votes").innerHTML =
                totalYesCount.toString();
            document.getElementById("nr-no-votes").innerHTML =
                totalNoCount.toString();

        } else {
            const totalYesCount = await communityDeployerContract.yesVoteCount();
            console.log("total yes count boolean: ", totalYesCount);
            const totalNoCount = await communityDeployerContract.noVoteCount();
            console.log("total No count boolean: ", totalNoCount);
            // get and display the nr of yes and no votes in the poll below
            document.getElementById("nr-yes-votes").innerHTML =
                totalYesCount.toString();
            document.getElementById("nr-no-votes").innerHTML =
                totalNoCount.toString();

        }

    } catch (error) {
        console.log(error)
    }
}


const queueEthers = async (
    contractAddress,
    contractABI,
) => {
    try {
        const { ethereum } = window;
        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const communityDeployerContract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );
            let txResponse;

            ethSubmit.innerHTML = "QUEUEING";

            try {
                
                txResponse = await communityDeployerContract.queue();

                try {
                    await txResponse.wait();
                    ethSubmit.innerHTML = "SUCCESSFULLY QUEUED";
                } catch (err) {
                    ethSubmit.innerHTML = "ALREADY QUEUED";
                }
            }
            catch (err) {
                ethSubmit.innerHTML = "ALREADY QUEUED";
            }
            
        } else {
            console.log("Web3 object doesn't exist!");
        }
    } catch (err) {
        console.log(err);
    }
};



const castVoteEthers = async (
    contractAddress,
    contractABI,
    yesVote
) => {
    try {
        const { ethereum } = window;
        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const communityDeployerContract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );
            let txResponse;

            ethSubmit.innerHTML = "VOTING";

            try {
                const account = await signer.getAddress();
                console.log("yes Vote boolean: ", await getYesVote());
                console.log("account", account);

                let votersJSON;
                
                await $.getJSON(
                    "https://api.npoint.io/e8e70e3f412defc543f4",
                    function (data) {
                        votersJSON = data;
                    }
                );

                console.log("votersJSON: ", votersJSON);
                if (votersJSON[account]) {
                    txResponse = await communityDeployerContract.castVote(
                        votersJSON[account]['index'],
                        votersJSON[account]['amount'],
                        yesVote,
                        votersJSON[account]['proof'],
                    );
                    try {
                        await txResponse.wait();
                        ethSubmit.innerHTML = "VOTE SUCCEEDED";
                        console.log("Success");

                        // if (yesVote) {
                        //     console.log("updating the yes vote counter");
                        //     document.getElementById("nr-yes-votes").innerHTML = document.getElementById("nr-yes-votes").innerHTML + votersJSON[account]['amount'];
                        //     console.log(document.getElementById("nr-yes-votes").innerHTML);
                        // } else {
                        //     console.log("updating the no vote counter");
                        //     document.getElementById("nr-no-votes").innerHTML = document.getElementById("nr-no-votes").innerHTML + votersJSON[account]['amount'];
                        //     console.log(document.getElementById("nr-no-votes").innerHTML);
                        // }
                        await voteCounter(web3);

                    } catch (err) {
                        console.log(err.message);
                        ethSubmit.innerHTML = "UNABLE TO VOTE";
                    }
                } else {
                    ethSubmit.innerHTML = "UNABLE TO VOTE";    
                }

            } catch (err) {
                console.log("updating status element: Status Failed");
                console.log(err.message);
                ethSubmit.innerHTML = "UNABLE TO VOTE";
            }
        } else {
            console.log("Web3 object doesn't exist!");
        }
    } catch (err) {
        console.log(err);
    }
};

const castVoteWeb3 = async (
    web3,
    contractAddress,
    contractABI,
    yesVote
) => {
    statusElement.innerHTML = `Status: Pending`;
    try {
        if (web3) {
            console.log("web3", web3);

            const communityDeployerContract = new web3.eth.Contract(
                contractABI,
                contractAddress
            );
            console.log(communityDeployerContract);

            try {
                const account = await web3.currentProvider.accounts[0];
                console.log("web3.currentProvider", web3.currentProvider);
                console.log("yes Vote boolean: ", await getYesVote());
                console.log("account", account);

                
                let votersJSON;
                
                await $.getJSON(
                    "https://api.npoint.io/e8e70e3f412defc543f4",
                    function (data) {
                        votersJSON = data;
                    }
                );

                if (votersJSON[account]) {

                    const receipt = await communityDeployerContract.methods
                    .castVote(
                        votersJSON[account]['index'],
                        votersJSON[account]['amount'],
                        yesVote,
                        votersJSON[account]['proof'],
                    )
                    .send({ from: account });

                    console.log(receipt);
                    walletConnect.innerHTML = "VOTE SUCCEEDED";
                    await voteCounter(web3);

                    statusElement.innerHTML = `Status: Success`;
                } else {
                    console.log("account not found in the voters json");
                }
                
            } catch (error) {
                console.log("updating status element: Status Failed");
                console.log(error.message);
            }
        } else {
            console.log("Web3 object doesn't exist!");
        }
    } catch (error) {
        console.log(error);
    }
};

const vote = async (web3) => {
    // change this to the mainnet adddress of the NFT contract
    const contractAddress = "0x36E3d9E6f22D9E02039FA6ec1CD073216E4D3E8C";

    let contractABI;

    const yesVote = getYesVote();

    await $.getJSON(
        "https://api.jsonbin.io/b/628527b525069545a33c4b81",
        function (data) {
            // JSON result in `data` variable
            console.log("Community Deployer ABI: ");
            contractABI = data.abi;
        }
    );

    if (web3) {
        castVoteWeb3(web3, contractAddress, contractABI, yesVote);
    } else {
        castVoteEthers(contractAddress, contractABI, yesVote);
    }
};


const queue = async (web3) => {
    // change this to the mainnet adddress of the NFT contract
    const contractAddress = "0x36E3d9E6f22D9E02039FA6ec1CD073216E4D3E8C";

    let contractABI;

    await $.getJSON(
        "https://api.jsonbin.io/b/628527b525069545a33c4b81",
        function (data) {
            // JSON result in `data` variable
            console.log("Community Deployer ABI: ");
            contractABI = data.abi;
        }
    );

    await queueEthers(contractAddress, contractABI);
};


// After the launch of the vote
// timelock in the UI (static call from contracts)
// todo: queue in the UI --> 2 functions one calling queue and one calling deploy function (Sol)
// todo: deploy in the UI --> see above line (Sol)
// todo: verify with etherscan --> artur will do that