// This is some text that can change

// [lock:1]
// line 1 - abc
// line 2 - def
// line 3 - ghi
// Hi hi hi!!
// SHOULD-PERSIST
// [/lock:1]

// This is some more text that can change
// ... and more

// [lock:2]
// line 4 - 123
// line 5 - 456
// These lines should synchronize
// line 6 - 789
// SHOULD-PERSIST
// [/lock:2]

// This is some text at the end that can change too!
// It's okay to make changes to this

// And this line should be locked! SHOULD-PERSIST yay // [lock:3/]

// [lock:missing-from-target]
// This block is missing from target on purpose. It shouldn't carry over.
// And we should see a warning about this.
// SHOULD-REMOVE
// [/lock:missing-from-target]

// Here's some text at the end
