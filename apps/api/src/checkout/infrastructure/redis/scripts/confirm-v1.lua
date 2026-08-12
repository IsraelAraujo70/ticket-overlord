if redis.call('EXISTS', KEYS[1]) == 1 then
  if redis.call('HGET', KEYS[1], 'fencingToken') ~= ARGV[1] then return {'STALE'} end
  local quantity = tonumber(redis.call('HGET', KEYS[1], 'quantity'))
  local held = tonumber(redis.call('HGET', KEYS[2], 'held') or '0')
  redis.call('HSET', KEYS[2], 'held', math.max(held - quantity, 0))
  redis.call('ZREM', KEYS[3], ARGV[2] .. '|' .. quantity)
  redis.call('ZREM', KEYS[4], ARGV[3])
  redis.call('DEL', KEYS[1], KEYS[5])
end
if redis.call('EXISTS', KEYS[2]) == 1 then
  local confirmed = tonumber(redis.call('HGET', KEYS[2], 'confirmed') or '0')
  if tonumber(ARGV[4]) > confirmed then redis.call('HSET', KEYS[2], 'confirmed', ARGV[4]) end
end
return {'OK'}
