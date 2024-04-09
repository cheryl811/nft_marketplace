
import './App.css';
import Navigation from './Navbar';

import { 
BrowserRouter,
Routes,
Route
} from "react-router-dom";

import { useState } from 'react';

// ethers will connect to metamask
// metamask is connected to blockchain
// ethers will use metamask(web3 provider) as its ethereum provider
import { ethers } from "ethers";

// address and abi of these contracts were stored in this location when they were deployed
import MarketplaceAbi from '../contractsData/Marketplace.json'
import MarketplaceAddress from '../contractsData/Marketplace-address.json'
import NFTAbi from '../contractsData/NFT.json'
import NFTAddress from '../contractsData/NFT-address.json'

// importing components
import Home from './Home.js'
import Create from './Create.js'
import MyListedItems from './MyListedItems.js'
import MyPurchases from './MyPurchases.js'

import { Spinner } from 'react-bootstrap';

function App() {

  // to keep track when app is loading data from the blockchain
  // when loading is false the contents of the app could be displayed
  const [loading, setLoading] = useState(true)

  // account - var to store current account in use
  // setAccount - function to update the stored value in account var by passing the new value as an argument to it
  const [account, setAccount] = useState(null)

  // storing each contracts into state of the application
  const [nft, setNFT] = useState({})
  const [marketplace, setMarketplace] = useState({})

  // MetaMask Login/Connect
  const web3Handler = async () => {
    
    // to get accounts listed in the metamask wallet, returns array of accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts'});
    setAccount(accounts[0])
    
    // get provider from MetaMask
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // set signer
    // gets the signer of the connected account of the provider
    const signer = provider.getSigner()

    loadContracts(signer)
  }

  const loadContracts = async (signer) => {
    // get deployed copies of the contract
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer)
    setMarketplace(marketplace)
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer)
    setNFT(nft)
    setLoading(false)
  }

  // loading ? - true then a spinner will be shown, else homepage
  // <Home marketplace={marketplace} nft={nft}/> passing the contracts to home component
  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navigation web3Handler={web3Handler} account={account} />
        </>
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="border" style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <Home marketplace={marketplace} nft={nft}/>
              } />
              <Route path="/create" element={
                <Create marketplace={marketplace} nft={nft}/>
              }/>
              <Route path="/my-listed-items" element={
                <MyListedItems marketplace={marketplace} nft={nft} account={account}/>
              }/>
              <Route path="/my-purchases" element={
                <MyPurchases marketplace={marketplace} nft={nft} account={account}/>
              }/>
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;