import { useState } from 'react';
import { ethers } from "ethers";
import { Row, Form, Button } from 'react-bootstrap';
import { uploadFileToIPFS, uploadJSONToIPFS } from './Pinata'; // Import Pinata functions

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('');
  const [price, setPrice] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const uploadToPinata = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (typeof file !== 'undefined') {
      try {
        const result = await uploadFileToIPFS(file); // Upload file to Pinata
        setImage(result.pinataURL);
        console.log("File uploaded to Pinata:", result);
      } catch (error){
        console.log("Pinata file upload error: ", error);
      }
    }
  };

  const createNFT = async () => {
    if (!image || !price || !name || !description) return;
    try {
      const metadata = {
        name,
        description,
        image,
        properties: {
          price
        }
      };
      const result = await uploadJSONToIPFS(metadata); // Upload metadata JSON to Pinata
      console.log("Metadata uploaded to Pinata:", result);
      mintThenList(result);
    } catch(error) {
      console.log("Pinata metadata upload error: ", error);
    }
  };

  const mintThenList = async (result) => {
    const uri = result.pinataURL;
    console.log(uri)
    await (await nft.mint(uri)).wait();
    const id = await nft.tokenCount();
    await (await nft.setApprovalForAll(marketplace.address, true)).wait();
    const listingPrice = ethers.utils.parseEther(price.toString());
    await (await marketplace.makeItem(nft.address, id, listingPrice)).wait();
  };

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToPinata} // Call uploadToPinata instead of uploadToNFTStorage
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create;
