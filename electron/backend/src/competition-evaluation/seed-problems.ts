import { DataSource } from 'typeorm';
import { Problem, ProblemDifficulty } from '../entities/problem.entity';

const dataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [Problem],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Database connected');

  const problemRepo = dataSource.getRepository(Problem);

  // Check if problems already exist
  const count = await problemRepo.count();
  if (count > 0) {
    console.log(`Already ${count} problems in database, skipping seed`);
    await dataSource.destroy();
    return;
  }

  const sampleProblems = [
    {
      competitionId: 1,
      title: '两数之和',
      description: '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。',
      inputDescription: '第一行包含两个整数 n 和 target，n 表示数组长度。第二行包含 n 个整数。',
      outputDescription: '输出两个整数的下标（如果有多个答案，返回任意一个）。',
      sampleInput: '5 9\n1 2 3 4 5',
      sampleOutput: '0 3',
      hint: '可以使用哈希表来优化查找。',
      testCases: JSON.stringify([
        { input: '5 9\n1 2 3 4 5', output: '0 3' },
        { input: '2 6\n3 3', output: '0 1' }
      ]),
      timeLimit: 1000,
      memoryLimit: 65536,
      difficulty: ProblemDifficulty.EASY,
      maxScore: 100,
      maxAttempts: 10,
      enabled: true,
    },
    {
      competitionId: 1,
      title: '回文数判断',
      description: '给你一个整数 x，如果 x 是一个回文整数，返回 true。否则返回 false。',
      inputDescription: '输入一个整数 x（-10^7 <= x <= 10^7）',
      outputDescription: '如果 x 是回文数输出 true，否则输出 false。',
      sampleInput: '121',
      sampleOutput: 'true',
      hint: '负数都不是回文数。',
      testCases: JSON.stringify([
        { input: '121', output: 'true' },
        { input: '-121', output: 'false' },
        { input: '10', output: 'false' }
      ]),
      timeLimit: 1000,
      memoryLimit: 65536,
      difficulty: ProblemDifficulty.EASY,
      maxScore: 100,
      maxAttempts: 10,
      enabled: true,
    },
    {
      competitionId: 1,
      title: '合并两个有序数组',
      description: '给你两个有序数组 nums1 和 nums2，请你将它们合并成一个有序数组。',
      inputDescription: '第一行两个整数 m 和 n，分别表示 nums1 和 nums2 的长度。接下来两行分别是两个数组的元素。',
      outputDescription: '输出合并后的有序数组（空格分隔）。',
      sampleInput: '3 3\n1 3 5\n2 4 6',
      sampleOutput: '1 2 3 4 5 6',
      hint: '可以使用双指针从前往后合并。',
      testCases: JSON.stringify([
        { input: '3 3\n1 3 5\n2 4 6', output: '1 2 3 4 5 6' }
      ]),
      timeLimit: 1000,
      memoryLimit: 65536,
      difficulty: ProblemDifficulty.MEDIUM,
      maxScore: 150,
      maxAttempts: 8,
      enabled: true,
    },
    {
      competitionId: 2,
      title: '二叉树遍历',
      description: '给定一棵二叉树的前序遍历和中序遍历结果，请重建这棵二叉树并输出其后序遍历结果。',
      inputDescription: '第一行是前序遍历（空格分隔），第二行是中序遍历（空格分隔）。',
      outputDescription: '输出后序遍历结果（空格分隔）。',
      sampleInput: '1 2 4 5 3\n4 2 5 1 3',
      sampleOutput: '4 5 2 3 1',
      hint: '递归构建左右子树。',
      testCases: JSON.stringify([
        { input: '1 2 4 5 3\n4 2 5 1 3', output: '4 5 2 3 1' }
      ]),
      timeLimit: 2000,
      memoryLimit: 131072,
      difficulty: ProblemDifficulty.HARD,
      maxScore: 200,
      maxAttempts: 5,
      enabled: true,
    },
    {
      competitionId: 2,
      title: '字符串反转',
      description: '将给定字符串中的每个单词反转后输出。',
      inputDescription: '输入一行字符串（仅包含英文字母和空格）。',
      outputDescription: '输出反转每个单词后的字符串。',
      sampleInput: 'hello world',
      sampleOutput: 'world hello',
      hint: '按空格分割字符串，然后反转每个部分。',
      testCases: JSON.stringify([
        { input: 'hello world', output: 'world hello' },
        { input: 'abc def ghi', output: 'ghi def abc' }
      ]),
      timeLimit: 1000,
      memoryLimit: 65536,
      difficulty: ProblemDifficulty.EASY,
      maxScore: 100,
      maxAttempts: 10,
      enabled: true,
    },
  ];

  for (const problem of sampleProblems) {
    await problemRepo.save(problemRepo.create(problem));
    console.log(`Created problem: ${problem.title}`);
  }

  console.log(`\nSeeded ${sampleProblems.length} problems successfully!`);
  await dataSource.destroy();
}

seed().catch(console.error);