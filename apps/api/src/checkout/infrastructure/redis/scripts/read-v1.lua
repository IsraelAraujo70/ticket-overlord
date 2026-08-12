if redis.call('EXISTS', KEYS[1]) == 0 then return {'MISSING'} end
if redis.call('HGET', KEYS[1], 'customerId') ~= ARGV[1] then return {'MISSING'} end
local state = redis.call('HGET', KEYS[1], 'state')
if state == 'REFUSED' then return {'MISSING'} end
if state == 'PENDING' and tonumber(redis.call('HGET', KEYS[1], 'expiresAt')) <= tonumber(ARGV[2]) then return {'EXPIRED'} end
return {'OK', unpack(redis.call('HGETALL', KEYS[1]))}
