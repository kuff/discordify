const Queue = require('../src/queue.js');

let queue = new Queue();

it('Instantiates', () => {
    expect( Array.isArray(queue.queue));

    expect( queue.queue.length)
    .toBe(  0);

    expect( Array.isArray(queue.history));

    expect( queue.history.length)
    .toBe(  0);
});

it('Enqueues Without Flags', () => {
    queue.enqueue({song: 'a song'});

    expect( queue.queue.length)
    .toBe(  1);

    queue.enqueue([
        {song: 'another song'},
        {this: 'must be an object'},
        {but: 'what it', contains: 'doesn\'t matter'}
    ]);

    expect( queue.queue.length)
    .toBe(  4);
});

it('Dequeues Without Flags', () => {
    expect(   queue.queue)
        .toEqual([{ song: 'a song' },
            { song: 'another song' },
            { this: 'must be an object' },
            { but: 'what it', contains: 'doesn\'t matter' }]);
    let item = queue.dequeue();
    expect(   item)
        .toEqual({ song: 'a song' });
    expect(   item)
        .not.toHaveProperty('flags');

    item = queue.dequeue();
    expect(   item)
        .toEqual({ song: 'another song' });
    expect(item)
        .not.toHaveProperty('flags');

    item = queue.dequeue();
    expect(   item)
        .toEqual({ this: 'must be an object' });
    expect(   item)
        .not.toHaveProperty('flags');

    item = queue.dequeue();
    expect(   item)
        .toEqual({ but: 'what it', contains: 'doesn\'t matter' });
    expect(   item)
        .not.toHaveProperty('flags');

    item = queue.dequeue();
    expect(   item)
        .toEqual(undefined);
});

it('Enqueues Single Song With Loop Flag', () => {
    queue.enqueue({ song: 'a song' }, [ 'loop' ]);
    expect(queue.queue[0])
        .toEqual({ song: 'a song', flags: [ 'loop' ]});
});

it('Enqueues Multiple Songs Multiple Flags', () => {
    queue.enqueue([
        { song: 'another song' },
        { this: 'must be an object', related: function (history) {
                return {
                    related: function (history) {
                        return { autoplayed: 'true!' }
                    }
                };
            } }
    ], [ 'loop', 'autoplay' ]);
    expect(queue.queue[1])
        .toEqual({ song: 'another song', 
        flags: ['loop', 'autoplay'] });
    expect(queue.queue[2])
        .toHaveProperty('this', 'must be an object');
    expect(queue.queue[2])
        .toHaveProperty('related');
    expect(queue.queue[2])
        .toHaveProperty('flags', ['loop', 'autoplay']);
});

it('Dequeues By Looping', () => {
    expect(queue.dequeue())
        .toEqual({ song: 'a song' });
    expect(queue.dequeue())
        .toEqual({ song: 'a song' });
    expect(queue.dequeue())
        .toEqual({ song: 'a song' });
    expect(queue.dequeue(true))
        .toEqual({ song: 'another song' });
    expect(queue.dequeue())
        .toEqual({ song: 'another song' });
    let item = queue.dequeue(true)
    expect(item)
        .toHaveProperty('this', 'must be an object');
    expect(item)
        .toHaveProperty('related');
});

it('Autoplays After End Loop Without Looping', () => {
    expect(queue.dequeue(true))
        .toHaveProperty('related');
    expect(queue.dequeue()) // Now this shouldn't loop!
        .toEqual({ autoplayed: 'true!' });
});

it('Enqueues Songs Flagged With Autoplay', () => {
    queue.enqueue([
        { but: 'what it', contains: 'doesn\'t matter' },
        { this: 'should however contain', related: function(history) {
            return { related: function(history) {
                return { autoplayed: 'true!' }
            } };
        }}
    ], [ 'autoplay' ]);
    expect(queue.queue[0])
        .toEqual({ but: 'what it', contains: 'doesn\'t matter', 
            flags: [ 'autoplay' ]});
    expect(queue.queue[1])
        .toHaveProperty('this', 'should however contain');
    expect(queue.queue[1])
        .toHaveProperty('related');
    expect(queue.queue[1])
        .toHaveProperty('flags', [ 'autoplay' ]);
});

it('Dequeues By Autoplay', () => {
    let item = queue.dequeue();
    expect(item)
    .toEqual({ but: 'what it', contains: 'doesn\'t matter'});
    expect(item)
    .not.toHaveProperty('flags');
    
    item = queue.dequeue();
    expect(item)
    .toHaveProperty('this', 'should however contain');
    expect(item)
    .toHaveProperty('related');
    expect(item)
    .not.toHaveProperty('flags');
    
    item = queue.dequeue(true); // User skip should not matter
    expect(item)
        .toHaveProperty('related');
    expect(item)
        .not.toHaveProperty('flags');

    item = queue.dequeue();
    expect(item)
        .toEqual({ autoplayed: 'true!' });
    expect(item)
        .not.toHaveProperty('flags');
})

it('Disengages Autoplay When New Songs Are Added To Queue', () => {
    queue.enqueue({ a: 'new song!' });
    expect(queue.dequeue())
        .toEqual({ a: 'new song!' });
    expect(queue.dequeue())
        .toEqual(undefined); // just to be sure
});

it('Songs Are Preserved When Flagged With "Shuffle"', () => {
    // cannot be sure of this without running a thorough shuffling-
    // test, which we will not do here.
    const input = [{ obj: 'hello' }, { obj: 'hello2' },
        { obj: 'hello3' }, { this: 'is an object' }];
    queue.enqueue(input, [ 'shuffle' ]);
    expect(queue.queue.length)
        .toEqual(input.length);
    queue.queue.forEach(elem => delete elem.flags); // hacking...
    const set = new Set()
    queue.queue.forEach(elem => set.add(elem));
    expect(set.size)
        .toEqual(4);
});

it('Songs Are Randomly Shuffled When Flagged With "Shuffle"', () => {
    const input = [{ obj: 'hello' }, { obj: 'hello2' },
        { obj: 'hello3' }, { this: 'is an object' }];
    const precision = 1000;
    const deviation = Math.ceil(precision * (1 / (input.length * 10)));
    let scores = [];
    for (i = 0; i < precision; i++) {
        queue.enqueue(input, [ 'shuffle' ]);
        for (j = 0; j < input.length; j++) {
            delete input[j].flags;
            delete queue.queue[j].flags;
            if (i == 0) scores[j] = 0;
            if (JSON.stringify(input[j]) === 
                JSON.stringify(queue.queue[0])) scores[j]++;
            queue.dequeue()
        }
    }
    const average = scores.reduce((prev, x) => {
        return prev += x
    }, 0) / input.length;

    // for debugging:
    /*console.log('results:', scores);
    console.log('measured average:', average);
    console.log('theoretical average:', precision /
        input.length);
    console.log('allowed deviation:', deviation);*/

    expect(average > Math.round(precision / input.length) -
        deviation)
        .toBe(true);
    expect(average < Math.round(precision / input.length) +
        deviation)
        .toBe(true);
});

it('Peeks Correctly', () => {
    queue = new Queue();
    expect(queue.peek())
        .toEqual(undefined);
    queue.dequeue();
    expect(queue.peek())
        .toEqual(undefined);
    queue.enqueue({ just: 'a song' })
    expect(queue.peek())
        .toEqual({ just: 'a song', flags: undefined });
    queue.enqueue({ and: 'another song' });
    expect(queue.peek())
        .toEqual({ just: 'a song', flags: undefined });
    queue.dequeue();
    expect(queue.peek())
        .toEqual({ and: 'another song', flags: undefined });
    queue.dequeue();
    expect(queue.peek())
        .toEqual(undefined);
    queue.dequeue();
    expect(queue.peek())
        .toEqual(undefined);

});

it('Clears Correctly', () => {
    expect(queue.queue)
        .toEqual([]);
    expect(queue.history)
        .toEqual([]);
    queue.enqueue([
        { the: 'next song is pointless' },
        { the_previous: 'song is right' }
    ]);
    queue.dequeue();
    queue.clear();
    expect(queue.queue)
        .toEqual([]);
    expect(queue.history)
        .toEqual([]);
});

it('Prints Correctly', () => {
    // ...
});