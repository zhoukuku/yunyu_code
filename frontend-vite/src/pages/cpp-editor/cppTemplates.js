// C++ Code Templates for the C++ Editor
// C++ 代码模板集合

export const cppTemplates = {
  // ============================================================================
  // 基础模板 (Basic Templates)
  // ============================================================================
  helloWorld: {
    name: 'Hello World',
    description: '最基础的 C++ 程序，输出 Hello World',
    category: '基础',
    icon: '👋',
    code: `// Hello World - C++ 入门第一个程序
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`
  },

  inputOutput: {
    name: '输入输出',
    description: 'C++ 基本输入输出操作',
    category: '基础',
    icon: '📥',
    code: `// C++ 基本输入输出示例
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    // 基本输出
    cout << "=== 基本输入输出 ===" << endl;

    // 整数输入输出
    int num;
    cout << "请输入一个整数: ";
    cin >> num;
    cout << "你输入的整数是: " << num << endl;

    // 多变量输入
    int a, b;
    cout << "请输入两个整数 (用空格分隔): ";
    cin >> a >> b;
    cout << "a = " << a << ", b = " << b << endl;

    // 浮点数输入
    double d;
    cout << "请输入一个浮点数: ";
    cin >> d;
    cout << "你输入的浮点数是: " << d << endl;

    // 字符串输入
    string name;
    cout << "请输入你的名字: ";
    cin >> name;
    cout << "你好, " << name << "!" << endl;

    // 循环输入多个数字
    cout << "=== 循环输入 ===" << endl;
    vector<int> numbers;
    cout << "输入 5 个整数 (输入 0 结束): " << endl;
    int input;
    while (cin >> input && input != 0 && numbers.size() < 5) {
        numbers.push_back(input);
    }
    cout << "你输入的数字: ";
    for (int n : numbers) cout << n << " ";
    cout << endl;

    return 0;
}`
  },

  // ============================================================================
  // 排序算法模板 (Sorting Algorithms)
  // ============================================================================
  sorting: {
    name: '排序算法',
    description: '冒泡、选择、插入、归并、快速排序',
    category: '算法',
    icon: '📈',
    code: `// C++ 排序算法模板
#include <iostream>
#include <vector>
#include <algorithm>
#include <ctime>
using namespace std;

// 冒泡排序
void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}

// 选择排序
void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        swap(arr[i], arr[minIdx]);
    }
}

// 插入排序
void insertionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

// 归并排序辅助函数
void merge(vector<int>& arr, int left, int mid, int right) {
    vector<int> temp(right - left + 1);
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
        }
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    for (int p = 0; p < k; p++) arr[left + p] = temp[p];
}

void mergeSort(vector<int>& arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

// 快速排序辅助函数
int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

// 打印数组
void printArray(const string& name, const vector<int>& arr) {
    cout << name << ": ";
    for (int n : arr) cout << n << " ";
    cout << endl;
}

int main() {
    cout << "=== 排序算法演示 ===" << endl;

    // 准备测试数据
    vector<int> original = {64, 34, 25, 12, 22, 11, 90, 45, 33, 77};

    // 冒泡排序
    vector<int> arr1 = original;
    cout << "\n原始数组: ";
    printArray("", arr1);

    bubbleSort(arr1);
    printArray("冒泡排序", arr1);

    // 选择排序
    vector<int> arr2 = original;
    selectionSort(arr2);
    printArray("选择排序", arr2);

    // 插入排序
    vector<int> arr3 = original;
    insertionSort(arr3);
    printArray("插入排序", arr3);

    // 归并排序
    vector<int> arr4 = original;
    mergeSort(arr4, 0, arr4.size() - 1);
    printArray("归并排序", arr4);

    // 快速排序
    vector<int> arr5 = original;
    quickSort(arr5, 0, arr5.size() - 1);
    printArray("快速排序", arr5);

    // STL sort (参考)
    vector<int> arr6 = original;
    sort(arr6.begin(), arr6.end());
    printArray("STL sort", arr6);

    return 0;
}`
  },

  // ============================================================================
  // 默认基础模板 (Default Template)
  // ============================================================================
  default: {
    name: '默认模板',
    description: '基础 C++ 程序，包含常用操作示例',
    category: '基础',
    icon: '📄',
    code: `// C++ 编辑器
// 在这里编写你的 C++ 代码

#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;

    // 尝试一些基本操作
    vector<int> numbers = {1, 2, 3, 4, 5};
    cout << "数组: ";
    for (int n : numbers) {
        cout << n << " ";
    }
    cout << endl;

    // 计算总和
    int sum = 0;
    for (int n : numbers) {
        sum += n;
    }
    cout << "总和: " << sum << endl;

    // 查找最大值
    int maxVal = *max_element(numbers.begin(), numbers.end());
    cout << "最大值: " << maxVal << endl;

    return 0;
}`
  },

  // ============================================================================
  // 算法模板 (Algorithm Template)
  // ============================================================================
  algorithm: {
    name: '算法模板',
    description: '常用算法实现：快速排序、二分查找',
    category: '算法',
    icon: '🔢',
    code: `// C++ 算法模板
#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

// 排序算法 - 快速排序
void quickSort(vector<int>& arr, int left, int right) {
    if (left >= right) return;
    int pivot = arr[(left + right) / 2];
    int i = left, j = right;
    while (i <= j) {
        while (arr[i] < pivot) i++;
        while (arr[j] > pivot) j--;
        if (i <= j) {
            swap(arr[i], arr[j]);
            i++;
            j--;
        }
    }
    if (left < j) quickSort(arr, left, j);
    if (i < right) quickSort(arr, i, right);
}

// 二分查找
int binarySearch(const vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> numbers = {64, 34, 25, 12, 22, 11, 90};
    cout << "原始数组: ";
    for (int n : numbers) cout << n << " ";
    cout << endl;

    quickSort(numbers, 0, numbers.size() - 1);
    cout << "排序后: ";
    for (int n : numbers) cout << n << " ";
    cout << endl;

    int target = 25;
    int result = binarySearch(numbers, target);
    cout << "查找 " << target << ": " << (result >= 0 ? "找到" : "未找到") << endl;

    return 0;
}`
  },

  // ============================================================================
  // 数据结构模板 (Data Structure Template)
  // ============================================================================
  datastructure: {
    name: '数据结构模板',
    description: '栈、队列、链表等数据结构实现',
    category: '数据结构',
    icon: '🏗️',
    code: `// C++ 数据结构模板
#include <iostream>
#include <vector>
#include <stack>
#include <queue>
#include <string>
using namespace std;

// 栈的应用 - 括号匹配
bool isValidParentheses(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            if ((c == ')' && top != '(') ||
                (c == ']' && top != '[') ||
                (c == '}' && top != '{')) {
                return false;
            }
            st.pop();
        }
    }
    return st.empty();
}

// 链表节点
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(NULL) {}
};

// 反转链表
ListNode* reverseList(ListNode* head) {
    ListNode* prev = NULL;
    ListNode* curr = head;
    while (curr) {
        ListNode* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

int main() {
    // 测试括号匹配
    string s = "{[()]}";
    cout << "括号 " << s << " 是否匹配: " << (isValidParentheses(s) ? "是" : "否") << endl;

    // 测试链表
    ListNode* head = new ListNode(1);
    head->next = new ListNode(2);
    head->next->next = new ListNode(3);
    head->next->next->next = new ListNode(4);
    head->next->next->next->next = new ListNode(5);

    cout << "原始链表: ";
    for (ListNode* p = head; p; p = p->next) cout << p->val << " ";
    cout << endl;

    head = reverseList(head);
    cout << "反转后: ";
    for (ListNode* p = head; p; p = p->next) cout << p->val << " ";
    cout << endl;

    return 0;
}`
  },

  // ============================================================================
  // 面向对象模板 (OOP Template)
  // ============================================================================
  oop: {
    name: '面向对象模板',
    description: '类和继承示例',
    category: 'OOP',
    icon: '🎯',
    code: `// C++ 面向对象编程模板
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// 基类
class Animal {
protected:
    string name;
    int age;
public:
    Animal(const string& n, int a) : name(n), age(a) {}
    virtual ~Animal() {}
    virtual void speak() const = 0;
    virtual void showInfo() const {
        cout << name << ", 年龄: " << age << endl;
    }
};

// 派生类 - 狗
class Dog : public Animal {
private:
    string breed;
public:
    Dog(const string& n, int a, const string& b) : Animal(n, a), breed(b) {}
    void speak() const override {
        cout << name << " 叫: 汪汪汪!" << endl;
    }
    void showInfo() const override {
        cout << "【狗】";
        Animal::showInfo();
        cout << " 品种: " << breed << endl;
    }
};

// 派生类 - 猫
class Cat : public Animal {
private:
    bool indoor;
public:
    Cat(const string& n, int a, bool ind) : Animal(n, a), indoor(ind) {}
    void speak() const override {
        cout << name << " 叫: 喵喵喵!" << endl;
    }
    void showInfo() const override {
        cout << "【猫】";
        Animal::showInfo();
        cout << " 室内猫: " << (indoor ? "是" : "否") << endl;
    }
};

int main() {
    vector<Animal*> animals;
    animals.push_back(new Dog("旺财", 3, "金毛"));
    animals.push_back(new Cat("咪咪", 2, true));
    animals.push_back(new Dog("大黄", 5, "中华田园犬"));

    cout << "=== 动物信息 ===" << endl;
    for (const auto& animal : animals) {
        animal->showInfo();
        animal->speak();
        cout << endl;
    }

    for (auto& animal : animals) {
        delete animal;
    }

    return 0;
}`
  },

  // ============================================================================
  // STL 容器模板
  // ============================================================================
  stl: {
    name: 'STL 容器模板',
    description: 'vector, map, set 等容器使用',
    category: 'STL',
    icon: '📦',
    code: `// C++ STL 容器模板
#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <algorithm>
#include <numeric>
using namespace std;

struct Student {
    string name;
    int score;
    Student(string n, int s) : name(n), score(s) {}
};

int main() {
    // vector 使用
    cout << "=== Vector 示例 ===" << endl;
    vector<int> vec = {5, 2, 8, 1, 9};
    cout << "原始: ";
    for (int v : vec) cout << v << " ";
    cout << endl;

    sort(vec.begin(), vec.end());
    cout << "排序后: ";
    for (int v : vec) cout << v << " ";
    cout << endl;

    int sum = accumulate(vec.begin(), vec.end(), 0);
    cout << "元素和: " << sum << endl;

    // map 使用
    cout << "\\n=== Map 示例 ===" << endl;
    map<string, int> scores;
    scores["Alice"] = 95;
    scores["Bob"] = 87;
    scores["Charlie"] = 92;

    for (const auto& p : scores) {
        cout << p.first << ": " << p.second << endl;
    }

    // set 使用
    cout << "\\n=== Set 示例 ===" << endl;
    set<int> uniqueNums = {1, 2, 2, 3, 3, 3, 4, 4, 4, 4};
    cout << "去重后的元素: ";
    for (int n : uniqueNums) cout << n << " ";
    cout << endl;

    return 0;
}`
  },

  // ============================================================================
  // 递归模板
  // ============================================================================
  recursion: {
    name: '递归模板',
    description: '递归算法示例：斐波那契、汉诺塔、全排列',
    category: '算法',
    icon: '🔄',
    code: `// C++ 递归算法模板
#include <iostream>
#include <vector>
using namespace std;

// 计算斐波那契数列
long long fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 递归实现排列
void permute(vector<int>& nums, int left, int right) {
    if (left == right) {
        for (int n : nums) cout << n << " ";
        cout << endl;
        return;
    }
    for (int i = left; i <= right; i++) {
        swap(nums[left], nums[i]);
        permute(nums, left + 1, right);
        swap(nums[left], nums[i]);
    }
}

// 递归二分查找
int recursiveBinarySearch(const vector<int>& arr, int target, int left, int right) {
    if (left > right) return -1;
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] > target) return recursiveBinarySearch(arr, target, left, mid - 1);
    return recursiveBinarySearch(arr, target, mid + 1, right);
}

// 汉诺塔
void hanoi(int n, char from, char to, char aux) {
    if (n == 1) {
        cout << "移动盘子 1 从 " << from << " 到 " << to << endl;
        return;
    }
    hanoi(n - 1, from, aux, to);
    cout << "移动盘子 " << n << " 从 " << from << " 到 " << to << endl;
    hanoi(n - 1, aux, to, from);
}

int main() {
    cout << "=== 斐波那契数列 ===" << endl;
    for (int i = 0; i < 10; i++) {
        cout << "fib(" << i << ") = " << fibonacci(i) << endl;
    }

    cout << "\\n=== 全排列 ===" << endl;
    vector<int> nums = {1, 2, 3};
    permute(nums, 0, nums.size() - 1);

    cout << "\\n=== 递归二分查找 ===" << endl;
    vector<int> arr = {1, 3, 5, 7, 9, 11, 13};
    cout << "查找 7: 位置 " << recursiveBinarySearch(arr, 7, 0, arr.size() - 1) << endl;

    cout << "\\n=== 汉诺塔 (3层) ===" << endl;
    hanoi(3, 'A', 'C', 'B');

    return 0;
}`
  },

  // ============================================================================
  // 动态规划模板
  // ============================================================================
  dynamicProgramming: {
    name: '动态规划模板',
    description: 'DP 问题通用解法：爬楼梯、背包、LCS',
    category: '算法',
    icon: '📊',
    code: `// C++ 动态规划模板
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// 爬楼梯问题
int climbStairs(int n) {
    if (n <= 2) return n;
    vector<int> dp(n + 1, 0);
    dp[1] = 1;
    dp[2] = 2;
    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

// 背包问题
int knapsack(int W, const vector<int>& weights, const vector<int>& values, int n) {
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    return dp[n][W];
}

// 最长公共子序列
int lcs(const string& s1, const string& s2) {
    int m = s1.size(), n = s2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1[i - 1] == s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
}

int main() {
    cout << "=== 爬楼梯 ===" << endl;
    for (int i = 1; i <= 10; i++) {
        cout << "台阶 " << i << ": " << climbStairs(i) << " 种方法" << endl;
    }

    cout << "\\n=== 0-1 背包问题 ===" << endl;
    vector<int> weights = {2, 3, 4, 5};
    vector<int> values = {3, 4, 5, 6};
    int W = 5;
    cout << "最大价值: " << knapsack(W, weights, values, weights.size()) << endl;

    cout << "\\n=== 最长公共子序列 ===" << endl;
    string s1 = "ABCDGE", s2 = "EDDGBC";
    cout << "LCS(\"" << s1 << "\", \"" << s2 << "\") = " << lcs(s1, s2) << endl;

    return 0;
}`
  },

  // ============================================================================
  // 字符串处理模板
  // ============================================================================
  string: {
    name: '字符串处理模板',
    description: '字符串操作函数：分割、反转、回文判断',
    category: '基础',
    icon: '📝',
    code: `// C++ 字符串处理模板
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <cctype>
using namespace std;

// 字符串分割
vector<string> split(const string& s, char delimiter) {
    vector<string> tokens;
    string token;
    istringstream iss(s);
    while (getline(iss, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}

// 字符串反转
string reverseString(const string& s) {
    return string(s.rbegin(), s.rend());
}

// 判断回文
bool isPalindrome(const string& s) {
    int left = 0, right = s.size() - 1;
    while (left < right) {
        if (tolower(s[left]) != tolower(s[right])) return false;
        left++;
        right--;
    }
    return true;
}

// 最长公共前缀
string longestCommonPrefix(const vector<string>& strs) {
    if (strs.empty()) return "";
    string prefix = strs[0];
    for (int i = 1; i < strs.size(); i++) {
        while (strs[i].find(prefix) != 0) {
            prefix = prefix.substr(0, prefix.size() - 1);
            if (prefix.empty()) return "";
        }
    }
    return prefix;
}

int main() {
    cout << "=== 字符串分割 ===" << endl;
    string s = "hello,world,foo,bar";
    vector<string> parts = split(s, ',');
    for (const string& p : parts) cout << "[" << p << "] ";
    cout << endl;

    cout << "\\n=== 字符串反转 ===" << endl;
    string original = "Hello, C++!";
    cout << "原字符串: " << original << endl;
    cout << "反转后: " << reverseString(original) << endl;

    cout << "\\n=== 回文判断 ===" << endl;
    string test1 = "racecar";
    string test2 = "hello";
    cout << "\"" << test1 << "\" 是回文: " << (isPalindrome(test1) ? "是" : "否") << endl;
    cout << "\"" << test2 << "\" 是回文: " << (isPalindrome(test2) ? "是" : "否") << endl;

    cout << "\\n=== 最长公共前缀 ===" << endl;
    vector<string> strs = {"flower", "flow", "flight"};
    cout << "[\"flower\", \"flow\", \"flight\"] 的最长公共前缀: "
         << longestCommonPrefix(strs) << endl;

    return 0;
}`
  },

  // ============================================================================
  // 文件读写模板
  // ============================================================================
  fileIO: {
    name: '文件读写模板',
    description: '文件操作示例',
    category: '基础',
    icon: '📁',
    code: `// C++ 文件读写模板
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>
using namespace std;

// 读取整个文件内容
string readFile(const string& filename) {
    ifstream file(filename);
    if (!file.is_open()) {
        return "错误: 无法打开文件 " + filename;
    }
    stringstream buffer;
    buffer << file.rdbuf();
    file.close();
    return buffer.str();
}

// 写入文件
bool writeFile(const string& filename, const string& content) {
    ofstream file(filename);
    if (!file.is_open()) {
        cout << "错误: 无法创建文件 " << filename << endl;
        return false;
    }
    file << content;
    file.close();
    return true;
}

// 按行读取文件
vector<string> readFileLines(const string& filename) {
    vector<string> lines;
    ifstream file(filename);
    if (!file.is_open()) {
        cout << "错误: 无法打开文件 " << filename << endl;
        return lines;
    }
    string line;
    while (getline(file, line)) {
        lines.push_back(line);
    }
    file.close();
    return lines;
}

int main() {
    cout << "=== 文件读写示例 ===" << endl;

    string filename = "test.txt";
    string content = "Hello, File I/O!\\n这是第二行。\\n第三行。";
    if (writeFile(filename, content)) {
        cout << "文件写入成功!" << endl;
    }

    cout << "\\n文件内容:\\n" << readFile(filename) << endl;

    cout << "\\n按行读取:\\n";
    vector<string> lines = readFileLines(filename);
    for (int i = 0; i < lines.size(); i++) {
        cout << i + 1 << ": " << lines[i] << endl;
    }

    cout << "\\n[提示] 实际文件操作需要后端 API 支持" << endl;

    return 0;
}`
  },

  // ============================================================================
  // 图算法模板
  // ============================================================================
  graph: {
    name: '图算法模板',
    description: 'BFS/DFS/最短路径算法',
    category: '算法',
    icon: '🔗',
    code: `// C++ 图算法模板
#include <iostream>
#include <vector>
#include <queue>
#include <stack>
#include <limits>
using namespace std;

class Graph {
private:
    int V;
    vector<vector<int>> adj;
public:
    Graph(int v) : V(v), adj(v) {}

    void addEdge(int v, int w) {
        adj[v].push_back(w);
    }

    void bfs(int start) {
        vector<bool> visited(V, false);
        queue<int> q;
        visited[start] = true;
        q.push(start);

        cout << "BFS: ";
        while (!q.empty()) {
            int v = q.front();
            cout << v << " ";
            q.pop();
            for (int n : adj[v]) {
                if (!visited[n]) {
                    visited[n] = true;
                    q.push(n);
                }
            }
        }
        cout << endl;
    }

    void dfs(int start) {
        vector<bool> visited(V, false);
        stack<int> s;
        s.push(start);

        cout << "DFS: ";
        while (!s.empty()) {
            int v = s.top();
            s.pop();
            if (!visited[v]) {
                visited[v] = true;
                cout << v << " ";
                for (int i = adj[v].size() - 1; i >= 0; i--) {
                    if (!visited[adj[v][i]]) {
                        s.push(adj[v][i]);
                    }
                }
            }
        }
        cout << endl;
    }

    void dijkstra(int start) {
        vector<int> dist(V, numeric_limits<int>::max());
        dist[start] = 0;
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
        pq.push({0, start});

        while (!pq.empty()) {
            int d = pq.top().first;
            int v = pq.top().second;
            pq.pop();

            if (d > dist[v]) continue;

            for (int n : adj[v]) {
                if (dist[v] + 1 < dist[n]) {
                    dist[n] = dist[v] + 1;
                    pq.push({dist[n], n});
                }
            }
        }

        cout << "从 " << start << " 出发的最短距离: ";
        for (int i = 0; i < V; i++) {
            cout << dist[i] << " ";
        }
        cout << endl;
    }
};

int main() {
    cout << "=== 图算法演示 ===" << endl;

    Graph g(7);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 3);
    g.addEdge(1, 4);
    g.addEdge(2, 3);
    g.addEdge(2, 5);
    g.addEdge(3, 5);
    g.addEdge(3, 6);
    g.addEdge(4, 6);
    g.addEdge(5, 6);

    g.bfs(0);
    g.dfs(0);
    g.dijkstra(0);

    return 0;
}`
  },

  // ============================================================================
  // 竞赛编程模板
  // ============================================================================
  competitive: {
    name: '竞赛编程模板',
    description: '竞赛常用代码片段和技巧',
    category: '竞赛',
    icon: '🏆',
    code: `// C++ 竞赛编程模板
#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <cstring>
#include <map>
#include <set>
#include <queue>
using namespace std;

// 常用常量
const int INF = 1e9;
const long long INFLL = 4e18;
const double EPS = 1e-9;

// 常用宏
#define ll long long
#define pb push_back
#define mp make_pair
#define fastio ios::sync_with_stdio(false); cin.tie(nullptr);

// 比较函数
template<typename T> bool chmin(T& a, const T& b) { return a > b ? a = b, true : false; }
template<typename T> bool chmax(T& a, const T& b) { return a < b ? a = b, true : false; }

// 最大公约数
ll gcd(ll a, ll b) { return b == 0 ? a : gcd(b, a % b); }

// 快速幂
ll modpow(ll a, ll e, ll mod) {
    ll r = 1;
    while (e) {
        if (e & 1) r = r * a % mod;
        a = a * a % mod;
        e >>= 1;
    }
    return r;
}

// 筛法素数
vector<int> sieve(int n) {
    vector<bool> isPrime(n + 1, true);
    isPrime[0] = isPrime[1] = false;
    for (int i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= n; j += i) isPrime[j] = false;
        }
    }
    vector<int> primes;
    for (int i = 2; i <= n; i++) if (isPrime[i]) primes.pb(i);
    return primes;
}

int main() {
    fastio;
    cout << "=== 竞赛编程模板 ===" << endl;

    cout << "gcd(24, 36) = " << gcd(24, 36) << endl;
    cout << "2^10 = " << modpow(2, 10, 1000000007) << endl;

    vector<int> primes = sieve(100);
    cout << "100以内的素数: ";
    for (int p : primes) cout << p << " ";
    cout << endl;

    return 0;
}`
  }
};

// Default C++ code template
export const DEFAULT_CODE = cppTemplates.default.code;

// Template categories for UI grouping
export const templateCategories = {
  '基础': { icon: '📄', color: '#1890ff' },
  '算法': { icon: '🔢', color: '#52c41a' },
  '数据结构': { icon: '🏗️', color: '#722ed1' },
  'OOP': { icon: '🎯', color: '#fa8c16' },
  'STL': { icon: '📦', color: '#eb2f96' },
  '竞赛': { icon: '🏆', color: '#faad14' }
};

// Get all template keys
export const getTemplateKeys = () => Object.keys(cppTemplates);

// Get templates by category
export const getTemplatesByCategory = (category) => {
  const filtered = {};
  Object.entries(cppTemplates).forEach(([key, template]) => {
    if (template.category === category) {
      filtered[key] = template;
    }
  });
  return filtered;
};