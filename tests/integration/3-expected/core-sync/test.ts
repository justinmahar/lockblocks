// I've changed this line. These changes should persist after an update SHOULD-PERSIST

// [lock:1]
// line 1 - abc
// line 2 - def
// line 3 - ghi
// Hi hi hi!!
// SHOULD-PERSIST
// [/lock:1]

// This is some more text that can change
// ... and more changes (made changes here!) SHOULD-PERSIST

// [lock:2]
// line 4 - 123
// line 5 - 456
// These lines should synchronize
// line 6 - 789
// SHOULD-PERSIST
// [/lock:2]

// This is some text at the end that I've definitely changed! But should persist
// These lines are different.

// And this line should be locked! SHOULD-PERSIST yay // [lock:3/]

// [lock:missing-from-origin]
// This block is missing from origin on purpose. It SHOULD-PERSIST
// And we should see a warning about this.
// SHOULD-PERSIST
// [/lock:missing-from-origin]

// Here's some text at the end I've changed SHOULD-PERSIST
