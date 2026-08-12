local expired = redis.call('ZRANGEBYSCORE', KEYS[2], '-inf', ARGV[1])
for _, member in ipairs(expired) do
  if redis.call('ZREM', KEYS[2], member) == 1 then
    local separator = string.find(member, '|', 1, true)
    local holdId = string.sub(member, 1, separator - 1)
    local quantity = tonumber(string.sub(member, separator + 1))
    redis.call('DEL', 'hold:' .. ARGV[2] .. ':' .. holdId, 'hold-owner:' .. holdId)
    local held = tonumber(redis.call('HGET', KEYS[1], 'held') or '0')
    redis.call('HSET', KEYS[1], 'held', math.max(held - quantity, 0))
  end
end
local nextExpiration = redis.call('ZRANGE', KEYS[2], 0, 0, 'WITHSCORES')
if #nextExpiration == 0 then redis.call('ZREM', KEYS[3], ARGV[2]) else redis.call('ZADD', KEYS[3], nextExpiration[2], ARGV[2]) end
return {'OK'}
