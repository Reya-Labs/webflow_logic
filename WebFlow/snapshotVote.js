const checkIfWalletConnectIsConnected = async (web3) => {
    console.log("window", window);
    let __isConnected = false;

    try {
        if (!web3) {
            console.log("Wallet connect is not connected");
        } else {
            console.log("We have the web3 object", web3);
            const accounts = await web3.eth.getAccounts(); // get all connected accounts
            console.log("accounts ", accounts);
            __isConnected = true;
        }
    } catch (error) {
        console.log(error);
    }

    return __isConnected;
};

const checkIfWalletIsConnected = async () => {
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
    console.log("isConnected", isConnected);
    return isConnected;
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
        console.log(web3, "web3");
        window.w3 = web3;
        const accounts = await web3.eth.getAccounts(); // get all connected accounts
        account = accounts[0]; // get the primary account
        console.log("WC account", account);
        // returning web3
        return web3;
    } catch (error) {
        console.log(error);
    }

    return web3;
};

const connectWallet = async () => {
    // connect to metamask
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

        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
        console.log(error);
    }
};

const getTokenId = async () => {
    /// retrive the tokenId from the text field here; id = field
    const tokenId = await document.getElementById("field").value;
    return tokenId;
};

const getYesVote = async () => {
    /// retrive the vote of the user from the radio buttons
    const yesVote = await document.getElementById("radio").checked; //  yes radio button has field id 'radio'
    return yesVote;
};

const publishVotingEndDate = async (web3) => {
    const contractAddress = "0x7B90850eE5903b8f0B7448A9EbE53c6F449e1A0d";
    let contractABI;

    await $.getJSON(
        "https://api.jsonbin.io/b/628273a525069545a338e71c",
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

    console.log('after the community deployer contract instance is created');
    console.log('Community Deployer Contract: ', communityDeployerContract);
    const endDate = await communityDeployerContract.blockTimestampVotingEnd();
    console.log('Printing endDate :', parseInt(endDate, 16));
    document.getElementById("voting-end-date").innerHTML = parseInt(endDate, 16); // injects the endDate into the section where it needs to be displayed
};

// const publishVotingEndDate = async (web3) => {
//     const contractAddress = "0x7B90850eE5903b8f0B7448A9EbE53c6F449e1A0d";
//     let contractABI;

//     await $.getJSON(
//         "https://api.jsonbin.io/b/628273a525069545a338e71c",
//         function (data) {
//             // JSON result in `data` variable
//             console.log("Community Deployer ABI: ");
//             contractABI = data.abi;
//         }
//     );
//     console.log("Community Deployment Contract ABI (end date function): ", contractABI);

//     console.log('inside the publishVotingEndDate function');
//     const communityDeployerContract = new web3.eth.Contract(
//         contractABI,
//         contractAddress
//     ); // create instance of the contract to retrieve data from.
//     console.log('after the community deployer contract instance is created');
//     const endDate = await communityDeployerContract // gets the endDate for the vote
//         .blockTimeStampVotingEnd()
//         .toString();
//     console.log('Printing endDate: ', endDate);
//     document.getElementById("voting-end-date").innerHTML = endDate; // injects the endDate into the section where it needs to be displayed
// };

// yes and no vote as a separate function 

const castVoteEthers = async (
    contractAddress,
    contractABI,
    tokenId,
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

            try {
                const account = await signer.getAddress();
                console.log("tokenId: ", await getTokenId());
                console.log("yes Vote boolean: ", await getYesVote());
                console.log("account", account);
                txResponse = await communityDeployerContract.castVote(tokenId, yesVote);

                try {
                    await txResponse.wait();
                    console.log("Success");
                    const totalYesCount = await communityDeployerContract.yesVoteCount();
                    console.log("total yes count boolean: ", totalYesCount);
                    const totalNoCount = await communityDeployerContract.noVoteCount();
                    console.log("total No count boolean: ", totalNoCount);
                    // get and display the nr of yes and no votes in the poll below
                    document.getElementById("nr-yes-votes").innerHTML =
                        totalYesCount.toString();
                    document.getElementById("nr-no-votes").innerHTML =
                        totalNoCount.toString();

                    //   statusElement.innerHTML = `Status: Success, number of yes votes so far is: ${totalYesCount}`; // which status element is this referring to?
                    //   console.log("Total Yes Count", totalYesCount.toString());
                } catch (err) {
                    const errorMessage = err.message;
                    console.log(errorMessage);
                    statusElement.innerHTML = `Status: Failed`;
                    console.log("Voting transaction failed");
                }
            } catch (err) {
                console.log("updating status element: Status Failed");
                console.log(err.message);
            }
        } else {
            console.log("Web3 object doesn't exist!");
        }
    } catch (err) {
        console.log(err);
    }
};

const castVoteWeb3 = async (
    // how to get the tokenID information from the input field on the form?
    web3,
    contractAddress,
    contractABI,
    tokenId,
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
                console.log("tokenId: ", await getTokenId());
                console.log("yes Vote boolean: ", await getYesVote());
                console.log("account", account);


                // show the nr of yes and no votes in the poll so far
                const totalYesCount = await communityDeployerContract.yesVoteCount();
                console.log("total Yes count: ", totalYesCount);
                const totalNoCount = await communityDeployerContract.noVoteCount();
                console.log("total No count boolean: ", totalNoCount);

                document.getElementById("nr-yes-votes").innerHTML =
                    totalYesCount.toString();
                document.getElementById("nr-no-votes").innerHTML =
                    totalNoCount.toString();

                const receipt = await communityDeployerContract.methods
                    .castVote(tokenId, yesVote)
                    .send({ from: account });
                console.log(receipt);
                statusElement.innerHTML = `Status: Success`;
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
    const contractAddress = "0x7B90850eE5903b8f0B7448A9EbE53c6F449e1A0d";

    let contractABI;

    const tokenId = getTokenId();
    const yesVote = getYesVote();

    await $.getJSON(
        "https://api.jsonbin.io/b/628273a525069545a338e71c",
        function (data) {
            // JSON result in `data` variable
            console.log("Community Deployer ABI: ");
            contractABI = data.abi;
        }
    );
    console.log(contractABI);

    if (web3) {
        castVoteWeb3(web3, contractAddress, contractABI, tokenId, yesVote);
    } else {
        castVoteEthers(contractAddress, contractABI, tokenId, yesVote);
    }
};

// todo: cast vote in the UI
// todo: show the total yes/no votes in the UI (static call in react) give ID
// todo: show end timestamps for voting (static call from contract) give ID

// After the launch of the vote
// timelock in the UI (static call from contracts)
// todo: show the quorum in the UI (can be hardcoded actually)
// todo: queue in the UI // after voting started
// todo: deploy in the UI // afer voting
// todo: verify with etherscan

// for the combinatronics link you need to have the file ready and uploaded on github, then paste the github link and it creates it for you
