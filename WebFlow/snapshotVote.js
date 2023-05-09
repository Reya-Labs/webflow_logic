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
      account = web3.utils.toChecksumAddress(account);
    }
  } catch (err) {
    console.log(err);
  }
};

const updateStatus = (newStatus) => {
  textStatus.innerHTML = `Status: ${newStatus}`;
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

      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (currentChainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });
        } catch (error) {
          updateStatus(
            "Unable to switch network to Avalanche. Make sure you have Avalanche in your added networks in Metamask."
          );
          window.confirm(
            "Unable to switch network to Avalanche. Make sure you have Avalanche in your added networks in Metamask."
          );
        }
      }

      isConnected = true;
    } else {
      updateStatus("No authorized account found");
      console.log("No authorized account found");
    }
  } catch (error) {
    updateStatus("Error when accessing Metamask");
    console.log(error);
  }

  console.log("Metamask connected status:", isConnected);
  return isConnected;
};

const checkIsConnectedWalletConnect = async () => {
  let isConnected = false;

  try {
    if (!web3) {
      console.log("Wallet connect is not connected");
    } else {
      console.log("We have the web3 object", web3);
      const accounts = await web3.eth.getAccounts();
      console.log("accounts ", accounts);

      const currentChainId = await web3.eth.getChainId();
      console.log(currentChainId, targetChainId);
      if (currentChainId !== targetChainId) {
        updateStatus(
          "Wrong network. To vote, disconnect and connect your wallet again on Avalanche."
        );
        window.confirm(
          "Wrong network. To vote, disconnect and connect your wallet again on Avalanche."
        );
      } else {
        isConnected = true;
      }
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

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
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
        42161: "https://arb1.arbitrum.io/rpc",
        421613: "https://goerli-rollup.arbitrum.io/rpc",
        43114: "https://api.avax.network/ext/bc/C/rpc",
        43113: "https://api.avax-test.network/ext/C/rpc",
      },
    });

    await provider.enable();

    //  Create Web3 instance
    web3 = new Web3(provider);
    window.w3 = web3;
    const accounts = await web3.eth.getAccounts(); // get all connected accounts
    account = accounts[0];
    // returning web3
    return web3;
  } catch (error) {
    console.log(error);
  }
};

const handleUserConnection = async () => {
  console.log(
    "handle user connection",
    isConnectedMetamask,
    isConnectedWalletConnect
  );

  if (isConnectedMetamask || isConnectedWalletConnect) {
    await refreshTermEnd();

    if (Date.now() <= termEnd * 1000) {
      const hasUserVoted = await hasVoted();
      if (hasUserVoted) {
        buttonSubmit.innerHTML = "YOU ALREADY VOTED";
      } else {
        const canUserVote = await canVote();
        if (canUserVote) {
          buttonSubmit.innerHTML = "VOTE";
        } else {
          buttonSubmit.innerHTML = "YOU ARE NOT ELIGIBLE TO VOTE";
        }
      }
    } else {
      const canUserQueue = await canQueue();
      if (canUserQueue) {
        buttonSubmit.innerHTML = "QUEUE";
      } else {
        const canUserDeploy = await canDeploy();
        if (canUserDeploy) {
          buttonSubmit.innerHTML = "DEPLOY";
        } else {
          buttonSubmit.innerHTML = "NO FURTHER ACTIONS";
        }
      }
    }

    buttonMetamask.style.display = "none";
    buttonWalletConnect.style.display = "none";
    buttonSubmit.style.display = "block";

    updateStatus(`Wallet ${account} connected`);

    refreshVoteCounters();
  } else {
    buttonMetamask.style.display = "block";
    buttonWalletConnect.style.display = "block";
    buttonSubmit.style.display = "none";

    updateStatus("Wallet not connected");
  }
};

const vote = async (isVoteYes) => {
  await getJSONAndPopulateVariables();
  if (isConnectedMetamask) {
    await voteMetamask(isVoteYes);
  } else if (isConnectedWalletConnect) {
    await voteWalletConnect(isVoteYes);
  }

  await refreshVoteCounters();
  await handleUserConnection();
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
      refreshTermEnd();
      // await voteCounter(web3);
    } else {
      updateStatus(`Connected account (${account}) is not eligible for voting`);
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
      refreshTermEnd();
    } else {
      updateStatus(`Connected account (${account}) is not eligible for voting`);
    }
  } catch (err) {
    console.log(err);
  }
};

const hasVoted = async () => {
  await getJSONAndPopulateVariables();
  if (isConnectedMetamask) {
    return await hasVotedMetamask();
  } else if (isConnectedWalletConnect) {
    return await hasVotedWalletConnect();
  }
};

const hasVotedMetamask = async () => {
  try {
    if (merkleDistributorInfo[account]) {
      return await communityDeployerContract.hasVoted(
        merkleDistributorInfo[account]["index"]
      );
    }
  } catch (err) {
    console.log(err);
    return false;
  }

  return false;
};

const hasVotedWalletConnect = async () => {
  try {
    if (merkleDistributorInfo[account]) {
      return await communityDeployerContract.methods
        .hasVoted(merkleDistributorInfo[account]["index"])
        .call();
    }
  } catch (err) {
    console.log(err);
    return false;
  }

  return false;
};

const canVote = async () => {
  await getJSONAndPopulateVariables();
  if (merkleDistributorInfo[account]) {
    return true;
  }

  return false;
};

const canQueue = async () => {
  await getJSONAndPopulateVariables();
  try {
    if (isConnectedMetamask) {
      await communityDeployerContract.callStatic.queue();
      return true;
    } else if (isConnectedWalletConnect) {
      await communityDeployerContract.methods.queue().estimateGas({from: account});
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
};

const canDeploy = async () => {
  await getJSONAndPopulateVariables();
  try {
    if (isConnectedMetamask) {
      await communityDeployerContract.callStatic.deploy();
      return true;
    } else if (isConnectedWalletConnect) {
      await communityDeployerContract.methods.deploy().estimateGas({from: account});
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
};

const refreshTermEnd = async () => {
  await getJSONAndPopulateVariables();

  termEnd = 0;
  if (isConnectedMetamask) {
    termEnd = await communityDeployerContract.blockTimestampVotingEnd();
  } else if (isConnectedWalletConnect) {
    termEnd = await communityDeployerContract.methods
      .blockTimestampVotingEnd()
      .call();
  } else {
    try {
      const readOnlyCommunityDeployerContract = getReadOnlyCommunityDeployerContract();
      termEnd = await readOnlyCommunityDeployerContract.blockTimestampVotingEnd();
    } catch (err) {}
  }

  // if (termEnd > 0) {
  //   const dateObject = new Date(termEnd * 1000);
  //   document.getElementById(
  //     "term-end"
  //   ).innerHTML = `When | ${dateObject.toLocaleString()}`;
  // } else {
  //   document.getElementById("term-end").innerHTML = `When | SOON!`;
  // }
};

const refreshVoteCounters = async () => {
  await getJSONAndPopulateVariables();

  let totalYesCount = null, totalNoCount = null;
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
    } else {
      try {
        const readOnlyCommunityDeployerContract = getReadOnlyCommunityDeployerContract();
        totalYesCount = await readOnlyCommunityDeployerContract.yesVoteCount();
        totalNoCount = await readOnlyCommunityDeployerContract.noVoteCount();
      } catch (err) {}
    }
  } catch (err) {
    console.log(err);
  }

  document.getElementById("yes-counter").innerHTML = (totalYesCount !== null) ? totalYesCount.toString() : '--';
  document.getElementById("no-counter").innerHTML = (totalNoCount !== null) ? totalNoCount.toString() : '--';
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

    await handleUserConnection();
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

    await handleUserConnection();
  } catch (err) {
    console.log(err);
  }
};


const getReadOnlyCommunityDeployerContract = async () => {
  return new ethers.Contract(
    communityDeployerAddress,
    communityDeployerABI,
    ethers.getDefaultProvider(targetChainId)
  );
}