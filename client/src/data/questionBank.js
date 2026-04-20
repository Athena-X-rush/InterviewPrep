export const questionBank = [
  {
    id: 'dsa-easy-1',
    topic: 'dsa',
    difficulty: 'easy',
    prompt: 'Which data structure follows the Last In, First Out (LIFO) principle?',
    options: ['Queue', 'Stack', 'Linked List', 'Heap'],
    correctAnswer: 'Stack',
    explanation: 'A stack removes the most recently inserted item first, which is the LIFO pattern.',
  },
  {
    id: 'dsa-easy-2',
    topic: 'dsa',
    difficulty: 'easy',
    prompt: 'What is the time complexity of accessing an element by index in an array?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 'O(1)',
    explanation: 'Arrays support direct index-based access because elements are stored in contiguous memory.',
  },
  {
    id: 'dsa-easy-3',
    topic: 'dsa',
    difficulty: 'easy',
    prompt: 'Which traversal visits the root node between the left and right subtrees in a binary tree?',
    options: ['Preorder', 'Inorder', 'Postorder', 'Level order'],
    correctAnswer: 'Inorder',
    explanation: 'Inorder traversal visits left subtree, then root, then right subtree.',
  },
  {
    id: 'dsa-easy-4',
    topic: 'dsa',
    difficulty: 'easy',
    prompt: 'Which data structure is best suited for implementing a breadth-first search?',
    options: ['Stack', 'Queue', 'Heap', 'Hash Set'],
    correctAnswer: 'Queue',
    explanation: 'BFS explores nodes level by level, and a queue preserves that visiting order.',
  },
  {
    id: 'dsa-easy-5',
    topic: 'dsa',
    difficulty: 'easy',
    prompt: 'Which of the following is a self-balancing binary search tree?',
    options: ['Trie', 'AVL Tree', 'Graph', 'Array'],
    correctAnswer: 'AVL Tree',
    explanation: 'AVL trees rebalance themselves after insertions and deletions to maintain height balance.',
  },
  {
    id: 'dsa-medium-1',
    topic: 'dsa',
    difficulty: 'medium',
    prompt: 'What is the primary advantage of using a Hash Table over a Binary Search Tree for storing and retrieving data?',
    options: [
      'Hash Tables have a faster search time complexity',
      'Hash Tables use more memory than Binary Search Trees',
      'Hash Tables are more suitable for sorted data',
      'Hash Tables are less flexible than Binary Search Trees',
    ],
    correctAnswer: 'Hash Tables have a faster search time complexity',
    explanation: 'Average-case lookup in a hash table is O(1), while balanced BST lookup is O(log n).',
  },
  {
    id: 'dsa-medium-2',
    topic: 'dsa',
    difficulty: 'medium',
    prompt: 'Why is merge sort preferred over quicksort for linked lists?',
    options: [
      'Merge sort needs less auxiliary memory on linked lists',
      'Partitioning is inefficient without random access',
      'Merge sort is unstable while quicksort is stable',
      'Quicksort cannot sort linked lists at all',
    ],
    correctAnswer: 'Partitioning is inefficient without random access',
    explanation: 'Linked lists do not support efficient random access, making quicksort partitioning less practical.',
  },
  {
    id: 'dsa-medium-3',
    topic: 'dsa',
    difficulty: 'medium',
    prompt: 'Which technique is most commonly used to detect cycles in a linked list with O(1) extra space?',
    options: ['Hashing visited nodes', 'Floyd’s tortoise and hare', 'Recursion', 'Binary search'],
    correctAnswer: 'Floyd’s tortoise and hare',
    explanation: 'The slow and fast pointer technique detects a cycle without extra memory.',
  },
  {
    id: 'dsa-medium-4',
    topic: 'dsa',
    difficulty: 'medium',
    prompt: 'What is the time complexity of inserting a new element into a binary heap?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 'O(log n)',
    explanation: 'After insertion, the heap may need to bubble the new element up, which takes logarithmic time.',
  },
  {
    id: 'dsa-medium-5',
    topic: 'dsa',
    difficulty: 'medium',
    prompt: 'Which data structure is most appropriate for implementing an LRU cache efficiently?',
    options: ['Array and queue', 'Hash map and doubly linked list', 'Binary tree and stack', 'Heap and queue'],
    correctAnswer: 'Hash map and doubly linked list',
    explanation: 'The hash map gives fast access, and the doubly linked list tracks recency for fast updates.',
  },
  {
    id: 'dsa-hard-1',
    topic: 'dsa',
    difficulty: 'hard',
    prompt: 'In Dijkstra’s algorithm, why must all edge weights be non-negative?',
    options: [
      'Negative edges make the graph disconnected',
      'The greedy choice may become invalid after a node is finalized',
      'Priority queues do not support negative values',
      'The algorithm only works on trees',
    ],
    correctAnswer: 'The greedy choice may become invalid after a node is finalized',
    explanation: 'A negative edge can later produce a shorter path to a node already considered final, breaking correctness.',
  },
  {
    id: 'dsa-hard-2',
    topic: 'dsa',
    difficulty: 'hard',
    prompt: 'Which property makes a segment tree useful for range queries?',
    options: [
      'It stores edges instead of nodes',
      'It divides the array into hierarchical intervals',
      'It guarantees constant-time updates',
      'It sorts elements automatically',
    ],
    correctAnswer: 'It divides the array into hierarchical intervals',
    explanation: 'Segment trees recursively partition an array into intervals, enabling efficient range aggregation.',
  },
  {
    id: 'dsa-hard-3',
    topic: 'dsa',
    difficulty: 'hard',
    prompt: 'Why can union by rank and path compression make disjoint-set operations almost constant time?',
    options: [
      'They remove all recursion',
      'They keep trees shallow across operations',
      'They convert the structure into a heap',
      'They sort the sets after each union',
    ],
    correctAnswer: 'They keep trees shallow across operations',
    explanation: 'These optimizations reduce tree height so finds and unions become extremely efficient amortized.',
  },
  {
    id: 'dsa-hard-4',
    topic: 'dsa',
    difficulty: 'hard',
    prompt: 'What is the main benefit of using a monotonic stack in array problems?',
    options: [
      'It always sorts the array',
      'It helps find next greater or smaller elements efficiently',
      'It replaces dynamic programming completely',
      'It guarantees O(1) memory',
    ],
    correctAnswer: 'It helps find next greater or smaller elements efficiently',
    explanation: 'Monotonic stacks are ideal for nearest greater/smaller queries in linear time.',
  },
  {
    id: 'dsa-hard-5',
    topic: 'dsa',
    difficulty: 'hard',
    prompt: 'When should you prefer topological sorting in graph problems?',
    options: [
      'When the graph is always undirected',
      'When dependencies form a directed acyclic graph',
      'When shortest weighted paths are needed',
      'When the graph contains negative cycles',
    ],
    correctAnswer: 'When dependencies form a directed acyclic graph',
    explanation: 'Topological order is defined for DAGs and is useful for dependency resolution and scheduling.',
  },
  {
    id: 'dbms-medium-1',
    topic: 'dbms',
    difficulty: 'medium',
    prompt: 'What is normalization primarily intended to reduce?',
    options: ['Query speed', 'Data redundancy', 'Disk partitions', 'Network latency'],
    correctAnswer: 'Data redundancy',
    explanation: 'Normalization organizes tables to reduce duplicate data and update anomalies.',
  },
  {
    id: 'dbms-medium-2',
    topic: 'dbms',
    difficulty: 'medium',
    prompt: 'Which SQL join returns all records from the left table and matching records from the right table?',
    options: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'SELF JOIN'],
    correctAnswer: 'LEFT JOIN',
    explanation: 'A LEFT JOIN keeps every row from the left table even when no right-side match exists.',
  },
  {
    id: 'dbms-medium-3',
    topic: 'dbms',
    difficulty: 'medium',
    prompt: 'What does ACID consistency ensure in transactions?',
    options: [
      'Queries are always fast',
      'The database remains in a valid state after a transaction',
      'Transactions are always parallel',
      'Tables cannot contain null values',
    ],
    correctAnswer: 'The database remains in a valid state after a transaction',
    explanation: 'Consistency ensures transactions preserve database rules and constraints.',
  },
  {
    id: 'os-medium-1',
    topic: 'operating system',
    difficulty: 'medium',
    prompt: 'What is the main purpose of virtual memory?',
    options: [
      'To replace the CPU cache',
      'To allow processes to use more logical memory than physically available',
      'To increase monitor resolution',
      'To eliminate context switching',
    ],
    correctAnswer: 'To allow processes to use more logical memory than physically available',
    explanation: 'Virtual memory maps logical addresses and uses disk-backed storage when RAM is insufficient.',
  },
  {
    id: 'os-medium-2',
    topic: 'operating system',
    difficulty: 'medium',
    prompt: 'Which scheduling algorithm can cause starvation of long processes?',
    options: ['Round Robin', 'FCFS', 'Shortest Job First', 'Priority with aging'],
    correctAnswer: 'Shortest Job First',
    explanation: 'Short jobs can keep arriving, delaying longer jobs indefinitely in pure SJF.',
  },
  {
    id: 'react-medium-1',
    topic: 'react',
    difficulty: 'medium',
    prompt: 'Why is a stable `key` prop important when rendering React lists?',
    options: [
      'It changes CSS order automatically',
      'It helps React correctly reconcile list items between renders',
      'It prevents state from ever updating',
      'It makes components render only once',
    ],
    correctAnswer: 'It helps React correctly reconcile list items between renders',
    explanation: 'Stable keys let React preserve identity and avoid mismatched state or unnecessary re-renders.',
  },
  {
    id: 'js-medium-1',
    topic: 'javascript',
    difficulty: 'medium',
    prompt: 'What is a closure in JavaScript?',
    options: [
      'A function bundled with references to its lexical scope',
      'A method that only works inside classes',
      'A syntax error caused by nested functions',
      'A built-in type for immutable objects',
    ],
    correctAnswer: 'A function bundled with references to its lexical scope',
    explanation: 'Closures let a function access variables from the scope where it was created, even later.',
  },
];

const normalizeTopic = (value) => value.trim().toLowerCase();

const shuffle = (items) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
};

export const buildQuizQuestions = ({ topic, difficulty, questionCount }) => {
  const normalizedTopic = normalizeTopic(topic);
  const exactMatches = questionBank.filter(
    (question) => question.topic === normalizedTopic && question.difficulty === difficulty
  );
  const topicMatches = questionBank.filter((question) => question.topic === normalizedTopic);
  const difficultyMatches = questionBank.filter((question) => question.difficulty === difficulty);

  const combined = [];
  const seen = new Set();

  [exactMatches, topicMatches, difficultyMatches, questionBank].forEach((group) => {
    shuffle(group).forEach((question) => {
      if (!seen.has(question.id) && combined.length < questionCount) {
        combined.push(question);
        seen.add(question.id);
      }
    });
  });

  return combined.slice(0, questionCount);
};
