local state = redis.call('HGET', KEYS[1], 'state')
local currentCapacity = tonumber(redis.call('HGET', KEYS[1], 'capacity'))
if not state and (redis.call('ZCARD', KEYS[2]) > 0 or redis.call('ZSCORE', KEYS[3], ARGV[4])) then
  return {'INCOMPLETE'}
end
if state == 'READY' and currentCapacity and currentCapacity ~= tonumber(ARGV[1]) then
  redis.call('HSET', KEYS[1], 'state', 'INITIALIZING')
  return {'CAPACITY_MISMATCH'}
end
if state ~= 'READY' then
  redis.call('HSET', KEYS[1], 'state', 'INITIALIZING', 'capacity', ARGV[1], 'confirmed', ARGV[2], 'held', '0', 'version', ARGV[3])
  redis.call('HSET', KEYS[1], 'state', 'READY')
else
  local confirmed = tonumber(redis.call('HGET', KEYS[1], 'confirmed') or '0')
  if tonumber(ARGV[2]) > confirmed then redis.call('HSET', KEYS[1], 'confirmed', ARGV[2]) end
end
return {'OK'}
