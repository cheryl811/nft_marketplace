import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";

const Home = ({ marketplace, nft }) => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    const loadMarketplaceItems = async () => {
        try {
            const itemCount = await marketplace.itemCount();
            console.log(itemCount)
            let fetchedItems = [];
            for (let i = 1; i <= itemCount; i++) {
                const item = await marketplace.items(i);
                if (!item.sold) {
                    const uri = await nft.tokenURI(item.tokenID);
                    const metadata = await fetchMetadataFromIPFS(uri);
                    const totalPrice = await marketplace.getTotalPrice(item.itemId);
                    fetchedItems.push({
                        totalPrice,
                        itemId: item.itemId,
                        seller: item.seller,
                        name: metadata.name,
                        description: metadata.description,
                        image: metadata.image
                    });
                }
            }
            setItems(fetchedItems);
            setLoading(false);
        } catch (error) {
            console.error("Error loading marketplace items:", error);
            setLoading(false);
        }
    }

    const fetchMetadataFromIPFS = async (uri) => {
        try {
            const response = await axios.get(uri);
            return response.data;
        } catch (error) {
            console.error("Error fetching metadata from IPFS:", error);
            return {};
        }
    };

    const buyMarketItem = async (item) => {
        try {
            console.log("Buying item:", item);
            console.log("Total price:", item.totalPrice);
            await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait();
            loadMarketplaceItems();
        } catch (error) {
            console.error("Error purchasing item:", error);
        }
    }

    useEffect(() => {
        loadMarketplaceItems();
    }, []);

    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
            <h2>Loading...</h2>
        </main>
    );

    return (
        <div className="flex justify-center">
            {items.length > 0 ?
                <div className="px-5 container">
                    <Row xs={1} md={2} lg={4} className="g-4 py-5">
                        {items.map((item, idx) => (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={item.image} />
                                    <Card.Body color="secondary">
                                        <Card.Title>{item.name}</Card.Title>
                                        <Card.Text>
                                            {item.description}
                                        </Card.Text>
                                    </Card.Body>
                                    <Card.Footer>
                                        <div className='d-grid'>
                                            <Button onClick={() => buyMarketItem(item)} variant="primary" size="lg">
                                                Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
                : (
                    <main style={{ padding: "1rem 0" }}>
                        <h2>No listed assets</h2>
                    </main>
                )}
        </div>
    );
}

export default Home;
