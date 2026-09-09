async function test() {
  const username = 'Kabil_08'
  console.log('Testing username:', username)

  // Method 1: Official GraphQL
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com'
      },
      body: JSON.stringify({
        query: `query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            profile {
              ranking
              reputation
            }
          }
          userContestRanking(username: $username) {
            rating
            globalRanking
            badge {
              name
            }
          }
        }`,
        variables: { username }
      })
    })
    const json = await res.json()
    console.log('Method 1 Result:', JSON.stringify(json, null, 2))
  } catch (err) {
    console.error('Method 1 error:', err.message)
  }

  // Method 2: Alfa LeetCode API
  try {
    const res2 = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${username}`)
    const json2 = await res2.json()
    console.log('Method 2 Result:', JSON.stringify(json2, null, 2))
  } catch (err) {
    console.error('Method 2 error:', err.message)
  }
}

test()
