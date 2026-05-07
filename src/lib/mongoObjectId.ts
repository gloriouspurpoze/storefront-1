const HEX24 = /^[a-f0-9]{24}$/i

export function isMongoObjectIdString(value: string | undefined | null): value is string {
  return typeof value === 'string' && HEX24.test(value)
}

/** Sprint ids from local storage use non-ObjectId strings; only persist real Mongo ids to the API. */
export function sprintIdForTeamWorkApi(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  return isMongoObjectIdString(value) ? value : undefined
}
