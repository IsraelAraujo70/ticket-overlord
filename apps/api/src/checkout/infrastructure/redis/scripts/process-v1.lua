if redis.call('EXISTS', KEYS[1]) == 0 then return {'MISSING'} end
if redis.call('HGET', KEYS[1], 'customerId') ~= ARGV[1] then return {'MISSING'} end
local state = redis.call('HGET', KEYS[1], 'state')
if state == 'PENDING' and tonumber(redis.call('HGET', KEYS[1], 'expiresAt')) <= tonumber(ARGV[2]) then return {'EXPIRED'} end
if state == 'PROCESSING' then
  if redis.call('HGET', KEYS[1], 'idempotencyKey') ~= ARGV[3] or redis.call('HGET', KEYS[1], 'outcome') ~= ARGV[4] then return {'CONFLICT'} end
  return {'OK', unpack(redis.call('HGETALL', KEYS[1]))}
end
if state == 'REFUSED' then
  if redis.call('HGET', KEYS[1], 'idempotencyKey') ~= ARGV[3] or ARGV[4] ~= 'REFUSED' then return {'CONFLICT'} end
  return {'OK', unpack(redis.call('HGETALL', KEYS[1]))}
end
if state ~= 'PENDING' then return {'NOT_PAYABLE'} end
local token = tonumber(redis.call('HGET', KEYS[1], 'fencingToken') or '0') + 1
redis.call('HSET', KEYS[1], 'state', 'PROCESSING', 'idempotencyKey', ARGV[3], 'outcome', ARGV[4], 'fencingToken', token, 'processingAt', ARGV[2], 'updatedAt', ARGV[2])
redis.call('ZREM', KEYS[2], ARGV[5] .. '|' .. redis.call('HGET', KEYS[1], 'quantity'))
local member = redis.call('HGET', KEYS[1], 'eventId') .. '|' .. ARGV[5] .. '|' .. redis.call('HGET', KEYS[1], 'quantity') .. '|' .. token .. '|' .. ARGV[3] .. '|' .. ARGV[4] .. '|' .. ARGV[1]
redis.call('ZADD', KEYS[3], tonumber(ARGV[2]) + tonumber(ARGV[6]), member)
return {'OK', unpack(redis.call('HGETALL', KEYS[1]))}
