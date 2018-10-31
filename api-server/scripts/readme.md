# standard of python here

all input and output should be JSON string, splited by \n

the output json should have type

## stdout output

### {"type":"prompt", "message": string}
to ask input from the caller

### {"type":"progress", "message": string, "progress": number(0.0-1.0)}
to tell the caller the progress percentage

### {"type":"result", "message": string, "data": any}
send the data to caller, it can be output multiple times.

## stdin input
any json

## stderr output
it can be any string