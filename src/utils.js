const songParts = [
  "Bridge",
  "Chorus",
  "Ending",
  "End Chord",
  "Instrumental",
  "Interlude",
  "Intro",
  "Outro",
  "Pre[- ]?Chorus",
  "Tag",
  "Turn",
  "Verse",
]

export function cleanBody(body) {
  let updatedBody = body

  const removeBracesRegex = new RegExp("\\[((" + songParts.join("|") + ")[ 0-9]*)\\]", "gim")
  updatedBody = updatedBody.replace(removeBracesRegex, "$1")

  // '[A B C]' => '| [A] [B] [C] |'
  updatedBody = updatedBody.replace(/\[([^\]]+ [^\]]*)\]/gm, m => {
    const withoutBrackets = m
      .replace(/^[\[ |]*/, '')
      .replace(/[\] |]*$/, '')

    const withNewBrackets = withoutBrackets
      .split(' ')
      .map(t => t.match(/[a-zA-Z]/) ? `[${t}]` : t)
      .join(' ')

    return withNewBrackets
  })

  // Add |'s before and after lines containing just chords
  updatedBody = updatedBody.replace(/^( *\[.*\] *)$/gim, m => {
    const nonChordNonWhitespaceChars = m.replace(/\[[^\]]*\]/g, '').replace(/\s/g, '').length
    if (nonChordNonWhitespaceChars > 0) {
      return m
    }
    return `| ${m} |`
  })

  for (const prt of songParts) {
    // Bridge X3 => Bridge:\n# (x3)
    updatedBody = updatedBody.replace(new RegExp("^(" + prt + "[ 0-9]*) *[(]?(x[0-9]+)[)]?$", 'gim'), "$1\n# ($2)")

    // <part> <number> => <part> <number>:
    updatedBody = updatedBody.replace(new RegExp("^" + prt + "[ 0-9]*$", 'gim'), m => m.replace(/ +$/, '') + ":")

    // REPEAT CHORUS 3 => # REPEAT CHORUS 3
    updatedBody = updatedBody.replace(new RegExp("^repeat * " + prt, 'gim'), '# $&')
  }

  return updatedBody
}

export function buildFlow(body) {
  const regex = new RegExp(
    "^(# REPEAT *)*"
    + "((" + songParts.join("|") + ")"
    + "[ 0-9]*):?"
    + "[\n# (]*(x *[0-9]*|[0-9] *x)?[)]?",
    'igm')

  // Find all the lines that match one of the song parts
  const flow = []
  let match
  while ((match = regex.exec(body)) !== null) {
    const repeat = match[4] ? parseInt(match[4].replace(/[ x]/gi, '')) : 1

    // Use the casing from the first occurrence (presumed to be the section heading)
    const part = match[2].trim().replace(/  /g, ' ').trim()
    const cleanPart = flow.find(existing => part.toLowerCase() === existing.toLowerCase()) || part

    for (let i = 0; i < repeat; i += 1) {
      flow.push(cleanPart)
    }
  }

  return "#Flow: " + flow.join(", ")
}

