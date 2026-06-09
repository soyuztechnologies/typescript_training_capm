
//Think of a generic as a placeholder that can 
// be replaced with different types later.

// interface Box {
//   value: number
// }

// const box: Box = {
//   value: 100
// }

///But what if tomorrow you want to store a string instead of a number?
interface Box<T> {
  value: T
}

const numberBox: Box<number> = {
  value: 100
}

const stringBox: Box<string> = {
  value: "Hello"
}

interface ODataV2Payload<T = unknown> {
  d: {
    results: T[]
  }
}

interface Student {
  name: string
  grade: number
}

const response: ODataV2Payload<Student> = {
  d: {
    results: [
      {
        name: "Rahul",
        grade: 5
      },
      {
        name: "Priya",
        grade: 6
      }
    ]
  }
}

console.log(response)