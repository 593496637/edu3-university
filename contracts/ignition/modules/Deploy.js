import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import YDTokenModule from "./YDToken.js";
import CourseManagerModule from "./CourseManager.js";
import SimpleStakingModule from "./SimpleStaking.js";

export default buildModule("DeployModule", (m) => {
  // 导入需要的合约模块 (去掉MockUSDT)
  const { ydToken } = m.useModule(YDTokenModule);
  const { courseManager } = m.useModule(CourseManagerModule);
  const { simpleStaking } = m.useModule(SimpleStakingModule);

  return {
    ydToken,
    courseManager,
    simpleStaking
  };
});