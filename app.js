// Cấu hình kết nối với mạng BASE Mainnet
const BASE_RPC_URL = 'https://mainnet.base.org';
const CONTRACT_ADDRESS = '0x0e381cd73faa421066dc5e2829a973405352168c';

// ABI tối thiểu cho việc truy vấn NFT
const MIN_ABI = [
    // Hàm balanceOf để lấy số lượng NFT
    {
        "inputs": [{"internalType": "address","name": "owner","type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    // Hàm tokenOfOwnerByIndex để lấy token ID theo index
    {
        "inputs": [
            {"internalType": "address","name": "owner","type": "address"},
            {"internalType": "uint256","name": "index","type": "uint256"}
        ],
        "name": "tokenOfOwnerByIndex",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    // Hàm tokenURI để lấy metadata URI của NFT
    {
        "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string","name": "","type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// Khởi tạo Web3
let web3;
let nftContract;

async function initWeb3() {
    try {
        web3 = new Web3(new Web3.providers.HttpProvider(BASE_RPC_URL));
        nftContract = new web3.eth.Contract(MIN_ABI, CONTRACT_ADDRESS);
        return true;
    } catch (error) {
        console.error('Lỗi khởi tạo Web3:', error);
        showError('Không thể kết nối với mạng BASE. Vui lòng thử lại sau.');
        return false;
    }
}

// Hàm chính để lấy và hiển thị NFT
async function getNFTs() {
    // Xóa thông báo lỗi cũ
    clearError();
    
    // Lấy địa chỉ ví từ input
    const walletAddress = document.getElementById('walletAddress').value.trim();
    
    // Kiểm tra địa chỉ ví hợp lệ
    if (!web3.utils.isAddress(walletAddress)) {
        showError('Địa chỉ ví không hợp lệ. Vui lòng kiểm tra lại.');
        return;
    }

    // Hiển thị loading
    showLoading(true);
    clearNFTs();

    try {
        // Lấy số lượng NFT của ví
        const balance = await nftContract.methods.balanceOf(walletAddress).call();
        
        if (balance == 0) {
            showError('Không tìm thấy NFT nào trong ví này.');
            return;
        }

        // Lấy thông tin từng NFT
        for (let i = 0; i < balance; i++) {
            try {
                // Lấy token ID
                const tokenId = await nftContract.methods.tokenOfOwnerByIndex(walletAddress, i).call();
                
                // Lấy metadata URI
                const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
                
                // Lấy metadata từ URI
                const metadata = await fetchMetadata(tokenURI);
                
                // Hiển thị NFT
                displayNFT(tokenId, metadata);
            } catch (error) {
                console.error(`Lỗi khi lấy thông tin NFT ${i}:`, error);
            }
        }
    } catch (error) {
        console.error('Lỗi khi lấy danh sách NFT:', error);
        showError('Có lỗi xảy ra khi lấy thông tin NFT. Vui lòng thử lại.');
    } finally {
        showLoading(false);
    }
}

// Hàm lấy metadata từ URI
async function fetchMetadata(uri) {
    try {
        // Xử lý URI dạng ipfs
        if (uri.startsWith('ipfs://')) {
            uri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }
        
        const response = await fetch(uri);
        return await response.json();
    } catch (error) {
        console.error('Lỗi khi lấy metadata:', error);
        return null;
    }
}

// Hàm hiển thị NFT lên giao diện
function displayNFT(tokenId, metadata) {
    if (!metadata) return;

    const container = document.getElementById('nftContainer');
    
    // Tạo thẻ hiển thị NFT
    const nftElement = document.createElement('div');
    nftElement.className = 'col-md-4 col-sm-6';
    
    // Xử lý đường dẫn hình ảnh
    let imageUrl = metadata.image;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
        imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    nftElement.innerHTML = `
        <div class="nft-card">
            <img src="${imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 alt="${metadata.name || 'NFT'}"
                 class="nft-image">
            <div class="nft-info">
                <div class="nft-title">${metadata.name || `NFT #${tokenId}`}</div>
                <div class="nft-description">${metadata.description || 'Không có mô tả'}</div>
            </div>
        </div>
    `;

    container.appendChild(nftElement);
}

// Các hàm tiện ích
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
}

function clearError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = '';
}

function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    loadingElement.classList.toggle('d-none', !show);
}

function clearNFTs() {
    const container = document.getElementById('nftContainer');
    container.innerHTML = '';
}

// Khởi tạo Web3 khi trang web được tải
window.addEventListener('load', initWeb3);