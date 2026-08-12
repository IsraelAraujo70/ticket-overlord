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
if redis.call('HGET', KEYS[1], 'state') ~= 'READY' then return {'NOT_READY'} end
local capacity = tonumber(redis.call('HGET', KEYS[1], 'capacity'))
if capacity ~= tonumber(ARGV[3]) then redis.call('HSET', KEYS[1], 'state', 'INITIALIZING'); return {'NOT_READY'} end
local confirmed = math.max(tonumber(redis.call('HGET', KEYS[1], 'confirmed') or '0'), tonumber(ARGV[4]))
local held = tonumber(redis.call('HGET', KEYS[1], 'held') or '0')
local quantity = tonumber(ARGV[6])
if capacity - confirmed - held < quantity then return {'INSUFFICIENT'} end
redis.call('HSET', KEYS[1], 'confirmed', confirmed, 'held', held + quantity)
redis.call('HSET', KEYS[4], 'id', ARGV[5], 'eventId', ARGV[2], 'customerId', ARGV[7], 'quantity', ARGV[6], 'unitPriceInCents', ARGV[8], 'totalInCents', tonumber(ARGV[8]) * quantity, 'currency', ARGV[9], 'state', 'PENDING', 'expiresAt', ARGV[10], 'createdAt', ARGV[1], 'updatedAt', ARGV[1], 'fencingToken', '0')
redis.call('ZADD', KEYS[2], ARGV[10], ARGV[5] .. '|' .. ARGV[6])
redis.call('ZADD', KEYS[3], ARGV[10], ARGV[2])
redis.call('SET', KEYS[5], ARGV[2])
return {'OK', tostring(capacity - confirmed - held - quantity)}
