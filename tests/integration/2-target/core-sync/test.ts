// I've changed this line. These changes should persist after an update SHOULD-PERSIST

// [lock:1]
// line 1 - abc
// This block has changed and should be updated
// SHOULD-REMOVE
// [/lock:1]

// This is some more text that can change
// ... and more changes (made changes here!) SHOULD-PERSIST

// [lock:2]
// line 2 - 456
// this block should be replaced
// SHOULD-REMOVE
// [/lock:2]

// This is some text at the end that I've definitely changed! But should persist
// These lines are different.

// And this line should be locked! (this change here should go away SHOULD-REMOVE) // [lock:3/]

// [lock:missing-from-origin]
// This block is missing from origin on purpose. It SHOULD-PERSIST
// And we should see a warning about this.
// SHOULD-PERSIST
// [/lock:missing-from-origin]

// Here's some text at the end I've changed SHOULD-PERSIST
