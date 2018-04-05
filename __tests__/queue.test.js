const Queue = require('../src/queue.js');

let queue = new Queue();

function wait4Me() { // for testing asyncronous related search
    return new Promise(resolve => {
        setTimeout(() => {
            return resolve({ autoplayed: 'true!' });
        }, 100);
    });
};

it('Instantiates', () => {
    expect( Array.isArray(queue.queue));

    expect( queue.queue.length)
    .toEqual(  0);

    expect( Array.isArray(queue.history));

    expect( queue.history.length)
    .toEqual(  0);
});

it('Enqueues Single Element Lists The Same As Single Elements', 
    () => {
        queue.enqueue({ song: 'a song' });
        const prev = Array.from(queue.queue);
        queue = new Queue();
        queue.enqueue([{ song: 'a song' }]); // <- wrapped in list
        expect(queue.queue)
            .toEqual(prev);
    })

it('Enqueues With No Flags Provided With No Flags Provided', () => {
    queue = new Queue();
    queue.enqueue({ song: 'a song' });

    expect(queue.queue)
        .toEqual([{ song: 'a song', flags: undefined }]);

    queue.enqueue([
        { song: 'another song' },
        { this: 'must be an object' },
        { but: 'what it', contains: 'doesn\'t matter' }
    ]);

    expect(queue.queue)
        .toEqual([
            { song: 'a song', flags: undefined },
            { song: 'another song', flags: undefined },
            { this: 'must be an object', flags: undefined },
            { but: 'what it', contains: 'doesn\'t matter'
                , flags: undefined },
        ]);
});

it('Dequeues And Manages History', async done => {
    expect(queue.queue)
        .toEqual([
            { song: 'a song' },
            { song: 'another song' },
            { this: 'must be an object' },
            { but: 'what it', contains: 'doesn\'t matter' }
        ]);
    expect(queue.history.length)
        .toEqual(0);
    let item = await queue.dequeue();
    expect(   item)
        .toEqual({ song: 'a song' });
    expect(   item)
        .toHaveProperty('flags');
    expect(queue.history)
        .toEqual([{ song: 'a song', flags: undefined }]);

    item = await queue.dequeue();
    expect(   item)
        .toEqual({ song: 'another song', flags: undefined });
    expect(queue.history)
        .toEqual([{ song: 'a song', flags: undefined },
            { song: 'another song', flags: undefined }]
        );

    item = await queue.dequeue();
    expect(   item)
        .toEqual({ this: 'must be an object', flags: undefined });
    expect(queue.history)
        .toEqual([{ song: 'a song', flags: undefined },
            { song: 'another song', flags: undefined },
            { this: 'must be an object', flags: undefined }]
        );

    item = await queue.dequeue();
    expect(   item)
        .toEqual({ but: 'what it', contains: 'doesn\'t matter', 
            flags: undefined });
    expect(queue.history)
        .toEqual([{ song: 'a song', flags: undefined },
            { song: 'another song', flags: undefined },
            { this: 'must be an object', flags: undefined },
            { but: 'what it', contains: 'doesn\'t matter',
                flags: undefined }]
        );

    item = await queue.dequeue();
    expect(   item)
        .toEqual(undefined);
    expect(queue.history)
        .toEqual([{ song: 'a song', flags: undefined },
            { song: 'another song', flags: undefined },
            { this: 'must be an object', flags: undefined },
            { but: 'what it', contains: 'doesn\'t matter',
                flags: undefined }]
        );
    queue.enqueue([{ one: 'song' }, { two: 'also song' }]);
    await queue.dequeue();
    await queue.dequeue();
    expect(queue.history)
        .toEqual([{ song: 'another song', flags: undefined },
            { this: 'must be an object', flags: undefined },
            { but: 'what it', contains: 'doesn\'t matter',
                flags: undefined },
            { one: 'song', flags: undefined },
            { two: 'also song', flags: undefined }]
        );
    done();
});

it('Enqueues Single Song With Loop Flag', () => {
    queue.enqueue({ song: 'a song' }, [ 'loop' ]);
    expect(queue.queue[0])
        .toEqual({ song: 'a song', flags: [ 'loop' ]});
});

it('Enqueues Multiple Songs With Multiple Flags', () => {
    queue.enqueue([
        { song: 'another song' },
        { this: 'must be an object', related: () => {
            return { related: () => wait4Me() }
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

it('Dequeues By Looping', async done => {
    const hist = queue.history;
    expect(queue.history.length)
        .toEqual(5);
    expect(await queue.dequeue())
        .toEqual({ song: 'a song', flags: ['loop'] });
    expect(queue.history)
        .toEqual(hist);
    expect(await queue.dequeue())
        .toEqual({ song: 'a song', flags: ['loop'] });
    expect(queue.history)
        .toEqual(hist);
    expect(await queue.dequeue(true))
        .toEqual({ song: 'another song', 
            flags: ['loop', 'autoplay'] });
    expect(queue.history[3])
        .toEqual({ song: 'a song', flags: ['loop'] });
    expect(queue.history[4])
        .toEqual({ song: 'another song', 
            flags: ['loop', 'autoplay'] }
        );
    expect(await queue.dequeue())
        .toEqual({ song: 'another song', 
            flags: ['loop', 'autoplay'] }
        );
    expect(queue.history[3])
        .toEqual({ song: 'a song', flags: ['loop'] });
    expect(queue.history[4])
        .toEqual({ song: 'another song',
            flags: ['loop', 'autoplay'] }
        );
    let item = await queue.dequeue(true)
    expect(item)
        .toHaveProperty('this', 'must be an object');
    expect(item)
        .toHaveProperty('related');
    expect(item)
        .toHaveProperty('flags', ['loop', 'autoplay'] );
    expect(queue.history[2])
        .toEqual({ song: 'a song', flags: ['loop'] });
    expect(queue.history[3])
        .toEqual({
            song: 'another song',
            flags: ['loop', 'autoplay']
        }
    );
    expect(queue.history[4])
        .toHaveProperty('this');
    done();
});

it('Autoplays After End Loop Without Looping', async done => {
    let hist = queue.history.slice();
    expect(await queue.dequeue(true))
        .toHaveProperty('related');
    expect(queue.history)
        .not.toEqual(hist);
    hist = queue.history.slice();
    expect(await queue.dequeue()) // now this shouldn't loop!
        .toEqual({ autoplayed: 'true!', 
            flags: ['autoplay'] }
        );
    expect(queue.history)
        .not.toEqual(hist);
    done();
});

it('Enqueues Songs Flagged With Autoplay', () => {
    queue.enqueue([
        { but: 'what it', contains: 'doesn\'t matter' },
        { this: 'should however contain', related: history => {
            return { related: () => wait4Me() }
        } }
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

it('Dequeues By Autoplaying', async done => {
    let item = await queue.dequeue();
    expect(item)
        .toEqual({ but: 'what it', contains: 'doesn\'t matter',
            flags: ['autoplay'] });
    
    item = await queue.dequeue();
    expect(item)
        .toHaveProperty('this', 'should however contain');
    expect(item)
        .toHaveProperty('related');
    expect(item)
        .toHaveProperty('flags', ['autoplay']);
    
    item = await queue.dequeue(true); // User skip should not matter
    expect(item)
        .toHaveProperty('related');
    expect(item)
        .toHaveProperty('flags', ['autoplay']);

    item = await queue.dequeue();
    expect(item)
        .toEqual({ autoplayed: 'true!', flags: ['autoplay'] });
    done();
})

it('Disengages Autoplay When New Songs Are Added To Queue', 
async done => {
    queue.enqueue({ a: 'new song!' });
    expect(await queue.dequeue())
        .toEqual({ a: 'new song!', flags: undefined });
    expect(await queue.dequeue())
        .toEqual(undefined); // just to be sure
    done();
});

it('Preserves Songs When Enqueued With "Shuffle"', () => {
    const input = [{ obj: 'hello' }, { obj: 'hello2' },
        { obj: 'hello3' }, { this: 'is an object' }];
    queue.enqueue(input, [ 'shuffle' ]);
    expect(queue.queue.length)
        .toEqual(input.length);
    input.forEach(elem => elem.flags = [ 'shuffle' ]);
    const set = new Set()
    queue.queue.forEach(elem => set.add(elem));
    expect(set.size)
        .toEqual(4);
    input.forEach(elem => {
        expect(queue.queue.indexOf(elem))
            .not.toEqual(-1);
    });
});

it('Randomly Shuffles Songs When Enqueued With "Shuffle"', () => {
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

it('Enqueues Songs Flagged With "Now"', () => {
    queue = new Queue();
    queue.enqueue({ song: 'a song'}, [ 'next' ]);
    expect(queue.queue)
        .toEqual([{ song: 'a song', flags: [ 'next' ] }]);
    queue.enqueue({ song: 'another song'}, [ 'next' ]);
    expect(queue.queue)
        .toEqual([{ song: 'another song', flags: [ 'next' ] },
            { song: 'a song', flags: [ 'next' ] }]
        );
    queue.enqueue([
        { song: 'another song' },
        { this: 'must be an object' },
        { but: 'what it', contains: 'doesn\'t matter' }
    ], [ 'next' ]);
    expect(queue.queue)
        .toEqual([
            { song: 'another song', flags: [ 'next' ] },
            { this: 'must be an object', flags: [ 'next' ] },
            { but: 'what it', contains: 'doesn\'t matter', 
                flags: [ 'next' ] },
            { song: 'another song', flags: [ 'next' ] },
            { song: 'a song', flags: [ 'next' ] }
        ]);
})

it('Enqueues Songs Flagged With Both "Shuffle" And "Next"', () => {
    const input = [
        { song: 'a song' },
        { song: 'another song' },
        { this: 'must be an object' },
        { but: 'what it', contains: 'doesn\'t matter' }
    ];
    queue = new Queue();
    queue.enqueue(input, ['shuffle', 'next']);
    expect(queue.queue.length)
    .toEqual(4);
    for(let i=0;i<4;i++) {
        queue.queue[i].flags
    }
    expect(queue.queue)
        .not.toEqual(input); // <- might fail, just run again!
    for(let i=0;i<4;i++) {
        expect(queue.queue.indexOf(input[i]))
            .not.toEqual(-1);
    }
});

it('Peeks At Queue', () => {
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

it('Peeks At History', () => {
    queue = new Queue();
    expect(queue.peek(queue.history))
        .toEqual(undefined);
    queue.history.push({ an: 'object' });
    expect(queue.peek(queue.history))
        .toEqual({ an: 'object' });
    queue.history.push({ another: 'object' });
    expect(queue.peek(queue.history))
        .toEqual({ another: 'object' });
    queue.history = [1,2,3,4,5];
    expect(queue.peek(queue.history))
        .toEqual(5);
});

it('Clears Queue', () => {
    queue = new Queue();
    expect(queue.queue)
        .toEqual([]);
    queue.enqueue([
        { the: 'next song is pointless' },
        { the_previous: 'song is right' }
    ]);
    queue.dequeue();
    queue.clear();
    expect(queue.queue)
        .toEqual([]);
});