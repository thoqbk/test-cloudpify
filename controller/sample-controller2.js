/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 13, 2016
 * 
 */

module.exports = SampleController2;

function SampleController2() {

    this.increase = function ($session, $response) {
        if ($session.count == null) {
            $session.count = {
                value: 0
            };
        } else {
            $session.count.value++;
        }
        $response.end($session.count);
    };

}

