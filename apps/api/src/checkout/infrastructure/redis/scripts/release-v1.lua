if redis.call('EXISTS', KEYS[1]) == 0 then return {'OK'} end
if redis.call('HGET', KEYS[1], 'fencingToken') ~= ARGV[1] then return {'STALE'} end
if redis.call('HGET', KEYS[1], 'state') == 'REFUSED' then return {'OK'} end
local quantity = tonumber(redis.call('HGET', KEYS[1], 'quantity'))
local held = tonumber(redis.call('HGET', KEYS[2], 'held') or '0')
redis.call('HSET', KEYS[2], 'held', math.max(held - quantity, 0))
redis.call('ZREM', KEYS[3], ARGV[2] .. '|' .. quantity)
redis.call('ZREM', KEYS[4], ARGV[3])
redis.call('HSET', KEYS[1], 'state', 'REFUSED')
redis.call('PEXPIRE', KEYS[1], ARGV[4])
redis.call('PEXPIRE', KEYS[5], ARGV[4])
return {'OK'}
