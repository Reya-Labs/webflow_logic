const getJSONAndPopulateVariables = async () => {
  json = await jsonPromise;
  communityDeployerABI = json["CommunityDeployerABI"];
  merkleDistributorInfo = json["MerkleDistributorInfo"];

  try {
    if (isConnectedMetamask) {
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      communityDeployerContract = new ethers.Contract(
        communityDeployerAddress,
        communityDeployerABI,
        signer
      );

      account = await signer.getAddress();
    } else if (isConnectedWalletConnect) {
      communityDeployerContract = new web3.eth.Contract(
        communityDeployerABI,
        communityDeployerAddress
      );

      account = await web3.currentProvider.accounts[0];
    }
  } catch (err) {
    console.log(err);
  }
};

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
  console.log(
    "handle user connection",
    isConnectedMetamask,
    isConnectedWalletConnect
  );
  if (isConnectedMetamask || isConnectedWalletConnect) {
    buttonMetamask.style.visibility = "hidden";
    buttonWalletConnect.style.visibility = "hidden";
    buttonVoteYes.style.visibility = "visible";
    buttonVoteNo.style.visibility = "visible";
  } else {
    buttonMetamask.style.visibility = "visible";
    buttonWalletConnect.style.visibility = "visible";
    buttonVoteYes.style.visibility = "hidden";
    buttonVoteNo.style.visibility = "hidden";
  }

  buttonQueue.style.visibility = "hidden";
  buttonDeploy.style.visibility = "hidden";
};

const vote = async (isVoteYes) => {
  await getJSONAndPopulateVariables();
  if (isConnectedMetamask) {
    await voteMetamask(isVoteYes);
  } else if (isConnectedWalletConnect) {
    await voteWalletConnect(isVoteYes);
  }
};

const voteMetamask = async (isVoteYes) => {
  try {
    if (merkleDistributorInfo[account]) {
      const txResponse = await communityDeployerContract.castVote(
        merkleDistributorInfo[account]["index"],
        merkleDistributorInfo[account]["amount"],
        isVoteYes,
        merkleDistributorInfo[account]["proof"]
      );

      await txResponse.wait();
      // await voteCounter(web3);
    } else {
      console.log("Account not eligible to vote");
    }
  } catch (err) {
    console.log(err);
  }
};

const voteWalletConnect = async (isVoteYes) => {
  try {
    if (merkleDistributorInfo[account]) {
      const receipt = await communityDeployerContract.methods
        .castVote(
          merkleDistributorInfo[account]["index"],
          merkleDistributorInfo[account]["amount"],
          isVoteYes,
          merkleDistributorInfo[account]["proof"]
        )
        .send({ from: account });
      console.log(`Voted ${isVoteYes} successfully`);
    } else {
      console.log("Account not eligible to vote");
    }
  } catch (err) {
    console.log(err);
  }
};

const refreshTermEnd = async () => {
  await getJSONAndPopulateVariables();

  let termEnd = 0;
  if (isConnectedMetamask) {
    termEnd = await communityDeployerContract.blockTimestampVotingEnd();
  } else if (isConnectedWalletConnect) {
    termEnd = await communityDeployerContract.methods
      .blockTimestampVotingEnd()
      .call();
  }

  if (termEnd > 0) {
    const dateObject = new Date(termEnd * 1000);
    document.getElementById("voting-end-date").innerHTML =
      dateObject.toLocaleString();
  } else {
    document.getElementById("voting-end-date").innerHTML = "SOON!";
  }
};

const refreshVoteCounters = async () => {
  await getJSONAndPopulateVariables();

  let totalYesCount = 0,
    totalNoCount = 0;
  try {
    if (isConnectedMetamask) {
      totalYesCount = await communityDeployerContract.yesVoteCount();
      totalNoCount = await communityDeployerContract.noVoteCount();
    } else if (isConnectedWalletConnect) {
      totalYesCount = await communityDeployerContract.methods
        .yesVoteCount()
        .call();
      totalNoCount = await communityDeployerContract.methods
        .noVoteCount()
        .call();
    }
  } catch (err) {
    console.log(err);
  }

  document.getElementById("nr-yes-votes").innerHTML = totalYesCount.toString();
  document.getElementById("nr-no-votes").innerHTML = totalNoCount.toString();
};

const queue = async () => {
  await getJSONAndPopulateVariables();

  try {
    if (isConnectedMetamask) {
      const tx = await communityDeployerContract.queue();
      await tx.wait();
    } else if (isConnectedWalletConnect) {
      await communityDeployerContract.methods.queue().send({ from: account });
    }
  } catch (err) {
    console.log(err);
  }
};

const deploy = async () => {
  await getJSONAndPopulateVariables();

  try {
    if (isConnectedMetamask) {
      const tx = await communityDeployerContract.deploy();
      await tx.wait();
    } else if (isConnectedWalletConnect) {
      await communityDeployerContract.methods.deploy().send({ from: account });
    }
  } catch (err) {
    console.log(err);
  }
};
