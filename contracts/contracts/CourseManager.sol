// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CourseManager is Ownable {
    IERC20 public ydToken;

    struct Course {
        uint256 id;
        string title;
        string description;
        uint256 price; // YD代币价格，18位小数
        address instructor;
        bool active;
        uint256 createdAt;
    }

    struct User {
        string nickname;
        string bio;
        uint256 updatedAt;
    }

    // 状态变量
    mapping(uint256 => Course) public courses;
    mapping(address => User) public users;
    mapping(address => mapping(uint256 => bool)) public purchases;
    mapping(address => uint256[]) public userCourses; // 用户创建的课程列表

    uint256 public courseCounter;

    // 事件
    event CourseCreated(
        uint256 indexed courseId,
        address indexed instructor,
        string title,
        string description,
        uint256 price,
        uint256 timestamp
    );

    event CoursePurchased(
        address indexed buyer,
        uint256 indexed courseId,
        address indexed instructor,
        uint256 price,
        uint256 timestamp
    );

    event UserUpdated(
        address indexed user,
        string nickname,
        string bio,
        uint256 timestamp
    );

    event CourseStatusChanged(uint256 indexed courseId, bool active);

    constructor(address _ydToken) Ownable(msg.sender) {
        ydToken = IERC20(_ydToken);
    }

    // 创建课程
    function createCourse(
        string memory title,
        string memory description,
        uint256 price
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(price > 0, "Price must be greater than 0");

        courseCounter++;
        courses[courseCounter] = Course({
            id: courseCounter,
            title: title,
            description: description,
            price: price,
            instructor: msg.sender,
            active: true,
            createdAt: block.timestamp
        });

        userCourses[msg.sender].push(courseCounter);

        emit CourseCreated(
            courseCounter,
            msg.sender,
            title,
            description,
            price,
            block.timestamp
        );
        return courseCounter;
    }

    // 购买课程
    function purchaseCourse(uint256 courseId) external {
        Course memory course = courses[courseId];
        require(course.active, "Course not active");
        require(course.instructor != address(0), "Course does not exist");
        require(
            course.instructor != msg.sender,
            "Cannot purchase your own course"
        );
        require(!purchases[msg.sender][courseId], "Already purchased");

        // 转账YD代币给讲师
        require(
            ydToken.transferFrom(msg.sender, course.instructor, course.price),
            "Transfer failed"
        );

        purchases[msg.sender][courseId] = true;

        emit CoursePurchased(
            msg.sender,
            courseId,
            course.instructor,
            course.price,
            block.timestamp
        );
    }

    // 更新用户信息
    function updateUser(string memory nickname, string memory bio) external {
        users[msg.sender] = User({
            nickname: nickname,
            bio: bio,
            updatedAt: block.timestamp
        });

        emit UserUpdated(msg.sender, nickname, bio, block.timestamp);
    }

    // 查询函数
    function getCourse(uint256 courseId) external view returns (Course memory) {
        return courses[courseId];
    }

    function hasPurchased(
        address user,
        uint256 courseId
    ) external view returns (bool) {
        return purchases[user][courseId];
    }

    function getUser(address userAddress) external view returns (User memory) {
        return users[userAddress];
    }

    function getUserCourses(
        address instructor
    ) external view returns (uint256[] memory) {
        return userCourses[instructor];
    }

    // 分页获取课程（gas优化）
    function getCoursesPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (Course[] memory) {
        require(limit <= 50, "Limit too high");
        require(offset < courseCounter, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > courseCounter) {
            end = courseCounter;
        }

        Course[] memory result = new Course[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = courses[i + 1]; // courseId从1开始
        }
        return result;
    }

    // 管理员功能：设置课程状态
    function setCourseStatus(uint256 courseId, bool active) external onlyOwner {
        require(
            courses[courseId].instructor != address(0),
            "Course does not exist"
        );
        courses[courseId].active = active;
        emit CourseStatusChanged(courseId, active);
    }

    // 获取总课程数
    function getTotalCourses() external view returns (uint256) {
        return courseCounter;
    }
}
