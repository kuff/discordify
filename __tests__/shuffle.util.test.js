const { shuffle } = require('../src/util.js');

const test = (input, times, callback) => {
    for(i = 0; i < times; i++) {
        callback(shuffle(input), input);
    }
};

it('Preserves Type, Length, And Elements', () => {
    test(
        [1, true, 3.1415, { this: 'is an object' }],
        100,
        (output, input) => {
            expect(Array.isArray(output))
            .toBe(true);
            expect(output.length)
            .toEqual(input.length);
            expect(output.sort())
            .toEqual(input.sort());
        }
    )
});

/**
 * Generates a randomly sized array of ascending integers
 */
const generate = () => {
    let rand = 0;
    let output = [];
    let count = 0;
    while(rand < 0.9) { // 0.9 being the size regulator constant
        count++;
        output.push(count)
        rand = Math.random();
    }
    return output;
}

it('Equally Distributes Elements', () => {
    for (k = 0; k < 100; k++) {
        const input = generate();
        const precision = 1000;
        const deviation = Math.ceil(precision * (1 / (input.length * 10)));
        let scores = [];
        input.sort();
        for (i = 0; i < precision; i++) {
            output = shuffle(input.slice(0));
            for(j = 0; j < input.length; j++) {
                if (i == 0) scores[j] = 0;
                if (input[j] === output[j]) scores[j]++;
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
    }
});

it('Handles Edge Cases', () => {
    test(
        [1], // Test for a single element
        10,
        (output, input) => {
            expect(Array.isArray(output))
                .toBe(true);
            expect(output.length)
                .toEqual(input.length);
            expect(output)
                .toEqual(input);
        }
    );
    test(
        [1, true], // Technically not an edge case
        10,
        (output, input) => {
            expect(Array.isArray(output))
                .toBe(true);
            expect(output.length)
                .toEqual(input.length);
            expect(output.sort())
                .toEqual(input.sort());
        }
    );
    test(
        [], // Test for no elements
        10,
        (output, input) => {
            expect(Array.isArray(output))
                .toBe(true);
            expect(output.length)
                .toEqual(input.length);
            expect(output)
                .toEqual(input);
        }
    );
});