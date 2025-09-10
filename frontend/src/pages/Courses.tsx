export default function Courses() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">课程中心</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">区块链基础</h3>
          <p className="text-gray-600 mb-4">了解区块链的核心概念和技术原理</p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-blue-600">100 YD</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              购买课程
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">智能合约开发</h3>
          <p className="text-gray-600 mb-4">学习使用Solidity开发智能合约</p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-blue-600">200 YD</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              购买课程
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">DeFi协议分析</h3>
          <p className="text-gray-600 mb-4">深入理解去中心化金融协议</p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-blue-600">300 YD</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              购买课程
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}