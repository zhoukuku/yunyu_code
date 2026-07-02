# Complex algorithm: QuickSort implementation
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

data = [64, 34, 25, 12, 22, 11, 90, 45, 33, 78, 55, 41]
print("Original:", data)
sorted_data = quicksort(data)
print("Sorted:", sorted_data)

# Fibonacci with memoization
def fib(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]

print("Fibonacci(20):", fib(20))
for i in range(10):
    print(f"fib({i}) = {fib(i)}")