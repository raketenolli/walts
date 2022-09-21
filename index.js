var motor_list, manufacturer_list, manufacturer_list_options;
var current_motor_data;

function check_convert_to_float(input_string) {
    value = parseFloat(input_string.replace(",", "."));
    if(value === NaN) {
        alert(`Input "${input_string}" is not a valid number!`);
        return -1;
    } else {
        return value;
    }
}

function sum(array) {
    return array.reduce((s, v) => s + v, s = 0);
}

if(localStorage.getItem("motor_list") === null) {
    update_motor_list();
} else {
    motor_list = JSON.parse(localStorage.getItem("motor_list"));
    update_manufacturer_dropdowns();
}

function update_manufacturer_dropdowns(element) {
    manufacturer_list = [...new Set(motor_list.map(e => e["manufacturerAbbrev"]))].sort((a, b) => a > b);
    let manufacturer_dropdowns = undefined;
    if(element) {
        manufacturer_dropdowns = element.querySelectorAll(".motor_manufacturer");
    } else {
        manufacturer_dropdowns = document.querySelectorAll(".motor_manufacturer");
    }
    manufacturer_dropdowns.forEach(dropdown => {
        let selected_manufacturer = undefined;
        if(dropdown.options.length > 0) { selected_manufacturer = Array.from(dropdown.options).filter(option => option.selected)[0].value; }
        while(dropdown.options.length > 0) { dropdown.options.remove(0); }
        manufacturer_list.forEach(manufacturer => {
            let new_option = document.createElement('option');
            new_option.value = manufacturer;
            new_option.innerHTML = manufacturer;
            if(manufacturer == selected_manufacturer) { new_option.selected = true; }
            dropdown.append(new_option);
        });
    });
}

function update_motor_list() {
    fetch("https://www.thrustcurve.org/api/v1/search.json?availability=available&maxResults=9999")
    .then(response => response.json())
    .then(response => {
        motor_list = response.results;
        Object.keys(localStorage).forEach(key => {
            if(key != "motor_list") {
                motor_data = JSON.parse(localStorage.getItem(key));
                motor_data.is_up_to_date = false;
                localStorage.setItem(key, JSON.stringify(motor_data));
            }
        })
        localStorage.setItem("motor_list", JSON.stringify(motor_list));
        update_manufacturer_dropdowns();
    });
}

function add_motors(element) {
    new_motors = document.createElement("fieldset");
    new_motors.style.width = "16em";
    new_motors.innerHTML = `<legend>Motor set</legend>
    <table>
        <tr>
            <td>Number</td>
            <td><input class="number" value="1" size="4"></input></td>
        </tr>
        <tr>
            <td>Motor manufacturer</td>
            <td><select class="motor_manufacturer" onChange="update_motor_selection(this)"></select></td>
        </tr>
        <tr>
            <td>Motor</td>
            <td><select class="motor" onChange="new_motor_selected(this)"></select></td>
        </tr>
        <tr>
            <td>Motor data</td>
            <td><span class="motor_data"></span></td>
        </tr>
        <tr>
            <td>Ignition delay</td>
            <td><input class="ignition_delay" value="0" size="4"/> s</td>
        </tr>
    </table>
    <button onClick="remove_motors(this)">Remove</button>`;
    element.insertAdjacentElement("beforebegin", new_motors);
    update_manufacturer_dropdowns(new_motors);
}

function add_stage(element) {
    let number_of_stages = get_number_of_stages();
    new_stage = document.createElement("div");
    new_stage.style.display = "flex";
    new_stage.style.flexDirection = "column";
    new_stage.style.overflowX = "auto";
    new_stage.setAttribute("class", "stage");
    new_stage.innerHTML = `<h2>Stage ${number_of_stages + 1}</h2>
        <div style="display:flex; flex-direction:row; overflow-x: auto;">
            <table>
                <tr>
                    <td>Diameter</td>
                    <td><input class="diameter" size="4"/> mm</td>
                </tr>
                <tr>
                    <td>Drag coefficient</td>
                    <td><input class="drag_coefficient" size="4"/></td>
                </tr>
                <tr>
                    <td>Empty mass</td>
                    <td><input class="empty_mass" size="4"/> g</td>
                </tr>
            </table>
            <fieldset style="width:16em;">
                <legend>Motor set</legend>
                <table>
                    <tr>
                        <td>Number</td>
                        <td><input class="number" value="1" size="4"></input></td>
                    </tr>
                    <tr>
                        <td>Motor manufacturer</td>
                        <td><select class="motor_manufacturer" onChange="update_motor_selection(this)"></select></td>
                    </tr>
                    <tr>
                        <td>Motor</td>
                        <td><select class="motor" onChange="new_motor_selected(this)"></select></td>
                    </tr>
                    <tr>
                        <td>Motor data</td>
                        <td><span class="motor_data"></span></td>
                    </tr>
                    <tr>
                        <td>Ignition delay</td>
                        <td><input class="ignition_delay" value="0" size="4"></input> s</td>
                    </tr>
                </table>
                <button onClick="remove_motors(this)">Remove</button>
            </fieldset>
            <button onClick="add_motors(this)">Add<br/>motors</button>
        </div>
        <button style="width:12em" onClick="remove_stage(this)">Remove stage</button>`;
    element.insertAdjacentElement("beforebegin", new_stage);
    update_manufacturer_dropdowns(new_stage);
}

function remove_motors(element) {
    motor_set_element = element.parentElement;
    motor_set_element.remove();
}

function remove_stage(element) {
    stage_element = element.parentElement;
    stage_element.remove();
    update_stage_numbers();
}

function get_number_of_stages() {
    return document.querySelectorAll(".stage").length;
}

function update_stage_numbers() {
    document.querySelectorAll(".stage").forEach((e, i) => {
        e.querySelector("h2").innerHTML = `Stage ${i + 1}`;
    });
}

function update_motor_selection(manufacturer_selection_element) {
    let selected_manufacturer = manufacturer_selection_element.value;
    let motor_dropdown = manufacturer_selection_element.closest("table").querySelector(".motor");
    while(motor_dropdown.firstChild) { motor_dropdown.removeChild(motor_dropdown.lastChild); }
    motor_list.filter(e => e.manufacturerAbbrev == selected_manufacturer).sort((a, b) => a.totImpulseNs > b.totImpulseNs).forEach(motor => {
        let new_option = document.createElement('option');
        new_option.value = motor.motorId;
        if(motor.designation.search(motor.commonName) == -1) {
            new_option.innerHTML = motor.designation + " (" + motor.commonName + ")";
        } else {
            new_option.innerHTML = motor.designation;
        }
        motor_dropdown.appendChild(new_option);
    })
}

function new_motor_selected(motor_selection_element) {
    let selected_motor = motor_selection_element.value;
    let motor_data_element = motor_selection_element.closest("table").querySelector(".motor_data");
    if(localStorage.getItem(selected_motor) === null || JSON.parse(localStorage.getItem(selected_motor)).is_up_to_date == false) {
        fetch("http://www.thrustcurve.org/api/v1/download.json?motorIds="+selected_motor+"&data=samples")
        .then(response => response.json())
        .then(response => {
            let cert_curves = response.results.filter(e => e.source == "cert");
            let thrust_curve;
            if(cert_curves.length > 0) {
                thrust_curve = cert_curves[0].samples;
            } else {
                thrust_curve = response.results[0].samples;
            }
            if(thrust_curve[0].time > 0.0) { thrust_curve.unshift({ "time": 0.0, "thrust": 0.0 })}
            if(thrust_curve[thrust_curve.length-1].thrust > 0.0) { thrust_curve.push({ "time": thrust_curve[thrust_curve.length-1].time+0.001, "thrust": 0.0 })}
            let this_motor = motor_list.filter(e => e.motorId == selected_motor)[0];
            let mass_curve = get_mass_curve_from_thrust_curve(thrust_curve, this_motor.totalWeightG, this_motor.propWeightG);
            current_motor_data = {
                "total_mass": this_motor.totalWeightG,
                "propellant_mass": this_motor.propWeightG,
                "total_impulse": this_motor.totImpulseNs,
                "avg_thrust": this_motor.avgThrustN,
                "thrust_curve": thrust_curve,
                "mass_curve": mass_curve,
                "is_up_to_date": true
            };
            motor_data_element.innerHTML = get_motor_data_innerHTML(current_motor_data);
            localStorage.setItem(selected_motor, JSON.stringify(current_motor_data));
        })
    } else {
        current_motor_data = JSON.parse(localStorage.getItem(selected_motor));
        motor_data_element.innerHTML = get_motor_data_innerHTML(current_motor_data);
    }
}

function get_motor_data_innerHTML(motor_data) {
    return `Total impulse: ${Number(motor_data.total_impulse.toPrecision(3))} Ns<br>
    Average thrust: ${Number(motor_data.avg_thrust.toPrecision(3))} N<br>
    Total mass: ${Number(motor_data.total_mass.toPrecision(3))} g<br>
    Propellant mass: ${Number(motor_data.propellant_mass.toPrecision(3))} g`
}

function get_mass_curve_from_thrust_curve(thrust_curve, total_mass, propellant_mass) {
    let intermediate_impulse = [ { "time": 0.0, "impulse": 0.0 } ];
    let total_impulse = thrust_curve.reduce((previous_impulse, current_sample, current_index, curve) => {
        if(current_index == curve.length-1) { return previous_impulse; } // on last point there is no next trapezoid to get partial impulse
        current_thrust = current_sample.thrust;
        current_time = current_sample.time;
        next_sample = curve[current_index+1];
        next_thrust = next_sample.thrust;
        next_time = next_sample.time;
        next_impulse = previous_impulse + (current_thrust + next_thrust) / 2.0 * (next_time - current_time); // trapezoid integration
        intermediate_impulse.push({ "time": next_time, "impulse": next_impulse });
        return next_impulse;
    }, 0);
    let kg_per_Ns = propellant_mass / (1000.0 * total_impulse);
    let mass_curve = intermediate_impulse.map(sample => {
        let used_propellant = sample.impulse * kg_per_Ns;
        let current_mass = total_mass / 1000.0 - used_propellant;
        return { "time": sample.time, "mass": current_mass };
    });
    return mass_curve;
}

function interpolate_on_curve(time, curve, value_name) {
    let index_second_point = curve.findIndex(point => point.time > time);
    let index_first_point = index_second_point - 1;
    let interpolated_value;
    if(index_first_point == -1) {
        interpolated_value = curve.at(0)[value_name];
    } else if (index_second_point == -1) {
        interpolated_value = curve.at(-1)[value_name];
    } else {
        interpolated_value = (time - curve[index_first_point].time) / (curve[index_second_point].time - curve[index_first_point].time) * (curve[index_second_point][value_name] - curve[index_first_point][value_name]) + curve[index_first_point][value_name];
    }
    return interpolated_value;
}

function round_to_nearest_scale(x) {
    // hard-coded for scales of 1, 2, 5 and their 10-multiples
    let ten_exponent = 0;
    while(x >= 10.0) {
        x = x / 10.0;
        ten_exponent += 1;
    }
    let multiplier = Math.pow(10, ten_exponent);
    if(x <= 1.6) {
        return 1.0*multiplier;
    } else if(x <= 3.2) {
        return 2.0*multiplier;
    } else if(x <= 8.0) {
        return 5.0*multiplier;
    } else {
        return 10.0*multiplier;
    }
}

function draw_chart(data, time, time_step, id) {
    const W = document.getElementById(id).viewBox.baseVal.width + document.getElementById(id).viewBox.baseVal.x;
    const W_chart = Number(document.getElementById(id).dataset.chartWidth);
    const H = document.getElementById(id).viewBox.baseVal.height;
    time = time * W / W_chart;
    let chart = "";
    // determine range of alt, vel and accel
    let delta_altitude = Math.max(...data["altitude"]);
    let delta_velocity = Math.max(...data["velocity"]);
    let min_acceleration = Math.min(...data["acceleration"]);
    let max_acceleration = Math.max(...data["acceleration"]);
    let delta_acceleration = max_acceleration - min_acceleration;
    let delta_mass = Math.max(...data["mass"]);
    // console.log(`delta_mass: ${delta_mass}`);
    // calculate proper grid step
    let step_altitude = round_to_nearest_scale(delta_altitude / 5.0);
    let step_velocity = round_to_nearest_scale(delta_velocity / 5.0);
    let step_acceleration = round_to_nearest_scale(delta_acceleration / 5.0);
    let step_mass = round_to_nearest_scale(delta_mass / 5.0);
    // console.log(`step alt ${step_altitude}, step vel ${step_velocity}, step accel ${step_acceleration}`);
    // calculate y-axis limits
    let lower_acceleration_limit = Math.floor(min_acceleration / step_acceleration) * step_acceleration;
    let upper_acceleration_limit = Math.ceil(max_acceleration / step_acceleration) * step_acceleration;
    let upper_altitude_limit = Math.ceil(delta_altitude / step_altitude) * step_altitude;
    let upper_velocity_limit = Math.ceil(delta_velocity / step_velocity) * step_velocity;
    let upper_mass_limit = Math.ceil(delta_mass / step_mass) * step_mass;
    let y_axis_intersect = H * upper_acceleration_limit / (upper_acceleration_limit - lower_acceleration_limit);
    // console.log(`accel limits ${lower_acceleration_limit} ${upper_acceleration_limit}, alt lim ${upper_altitude_limit}, vel lim ${upper_velocity_limit}, mass lim ${upper_mass_limit}, y inters. ${y_axis_intersect}`);
    // draw vertical grid lines for time (every second, regardless of total time)
    for(let t = 1.0; t < time; t += 1.0) {
        chart += `<line x1="${t / time * W}" y1="0" x2="${t / time * W}" y2="${H}" stroke="#777777" stroke-width="1" stroke-opacity="0.5"></line>`;
    }
    // draw horizontal grid lines for every scale (alt blue #4b6fe2 hsluv 260/80/50, vel green #338655 hsluv 140/80/50, accel red #c65333 hsluv 20/80/50, mass grey #77777 hsluv */0/50)
    for(let m = 0.0; m < upper_mass_limit; m += step_mass) {
        chart += `<line x1="1" y1="${y_axis_intersect - m / upper_mass_limit * y_axis_intersect}" x2="${W}" y2="${y_axis_intersect - m / upper_mass_limit * y_axis_intersect}" stroke="#777777" stroke-width="1" stroke-opacity="0.5"></line>`;
    }
    for(let a = lower_acceleration_limit; a < upper_acceleration_limit; a += step_acceleration) {
        chart += `<line x1="1" y1="${y_axis_intersect - a / upper_acceleration_limit * y_axis_intersect}" x2="${W}" y2="${y_axis_intersect - a / upper_acceleration_limit * y_axis_intersect}" stroke="#c65333" stroke-width="1" stroke-opacity="0.5"></line>`;
    }
    for(let v = 0.0; v < upper_velocity_limit; v += step_velocity) {
        chart += `<line x1="1" y1="${y_axis_intersect - v / upper_velocity_limit * y_axis_intersect}" x2="${W}" y2="${y_axis_intersect - v / upper_velocity_limit * y_axis_intersect}" stroke="#338655" stroke-width="1" stroke-opacity="0.5"></line>`;
    }
    for(let a = 0.0; a < upper_altitude_limit; a += step_altitude) {
        chart += `<line x1="1" y1="${y_axis_intersect - a / upper_altitude_limit * y_axis_intersect}" x2="${W}" y2="${y_axis_intersect - a / upper_altitude_limit * y_axis_intersect}" stroke="#4b6fe2" stroke-width="1" stroke-opacity="0.5"></line>`;
    }
    // draw x-axis
    chart += `<line x1="1" y1="${y_axis_intersect}" x2="${W}" y2="${y_axis_intersect}" stroke="#777777" stroke-width="1"></line>`;
    // draw y-axis
    chart += `<line x1="1" y1="0" x2="1" y2="${H}" stroke="#777777" stroke-width="1"></line>`;
    // draw curves 
    let mass_points = "";
    data["mass"].forEach((m, t) => {
        mass_points += `${((t+1.0) * time_step) / time * W},${y_axis_intersect - m / upper_mass_limit * y_axis_intersect} `
    });
    chart += `<polyline points="${mass_points}" stroke="#777777" stroke-width="2" fill="none"></polyline>`
    let accel_points = "";
    data["acceleration"].forEach((a, t) => {
        accel_points += `${((t+1.0) * time_step) / time * W},${y_axis_intersect - a / upper_acceleration_limit * y_axis_intersect} `
    });
    chart += `<polyline points="${accel_points}" stroke="#c65333" stroke-width="3" fill="none"></polyline>`
    let vel_points = "";
    data["velocity"].forEach((v, t) => {
        vel_points += `${((t+1.0) * time_step) / time * W},${y_axis_intersect - v / upper_velocity_limit * y_axis_intersect} `
    });
    chart += `<polyline points="${vel_points}" stroke="#338655" stroke-width="3" fill="none"></polyline>`
    let alt_points = "";
    data["altitude"].forEach((a, t) => {
        alt_points += `${((t+1.0) * time_step) / time * W},${y_axis_intersect - a / upper_altitude_limit * y_axis_intersect} `
    });
    chart += `<polyline points="${alt_points}" stroke="#4b6fe2" stroke-width="3" fill="none"></polyline>`
    // add text, should be on top of everything else
    for(let t = 1.0; t < time; t += 1.0) {
        chart += `<text x="${t / time * W}" y="${y_axis_intersect - 5}" text-anchor="middle">${t.toFixed(1)}</text>`;
    }
    for(let m = 0.0; m < upper_mass_limit; m += step_mass) {
        chart += `<text x="-100" y="${y_axis_intersect - m / upper_mass_limit * y_axis_intersect}" text-anchor="end" fill="#777777">${Number(m.toPrecision(2))}</text>`;
    }
    for(let a = lower_acceleration_limit; a < upper_acceleration_limit; a += step_acceleration) {
        chart += `<text x="-67" y="${y_axis_intersect - a / upper_acceleration_limit * y_axis_intersect}" text-anchor="end" fill="#c65333">${Number(a.toPrecision(2))}</text>`;
    }
    for(let v = 0.0; v < upper_velocity_limit; v += step_velocity) {
        chart += `<text x="-33" y="${y_axis_intersect - v / upper_velocity_limit * y_axis_intersect}" text-anchor="end" fill="#338655">${Number(v.toPrecision(2))}</text>`;
    }
    for(let a = 0.0; a < upper_altitude_limit; a += step_altitude) {
        chart += `<text x="-1" y="${y_axis_intersect - a / upper_altitude_limit * y_axis_intersect}" text-anchor="end" fill="#4b6fe2">${Number(a.toPrecision(2))}</text>`;
    }
    // write SVG as innerHTML to element with id
    document.getElementById(id).innerHTML = chart;
}

function get_rocket_configuration() {
    return Array.from(document.querySelectorAll("div.stage")).map(stage_element => {
        return {
            "diameter": check_convert_to_float(stage_element.querySelector("input.diameter").value) / 1000.0,
            "drag_coefficient": check_convert_to_float(stage_element.querySelector("input.drag_coefficient").value),
            "empty_mass": check_convert_to_float(stage_element.querySelector("input.empty_mass").value) / 1000.0,
            "motor_sets": Array.from(stage_element.querySelectorAll("fieldset")).map(motor_set => {
                return {
                    "number": check_convert_to_float(motor_set.querySelector("input.number").value),
                    "motor": motor_set.querySelector("select.motor").value,
                    "ignition_delay": check_convert_to_float(motor_set.querySelector("input.ignition_delay").value)
                }
            })
        }
    });
}

function get_burnout_from_motor_set(motor_set) {
    let motor_data = JSON.parse(localStorage.getItem(motor_set.motor));
    let burntime = motor_data.thrust_curve.at(-1).time;
    let ignition_delay = motor_set.ignition_delay;
    let burnout = burntime + ignition_delay;
    return burnout;
}

function get_max_burnout_for_stage(stage) {
    let burnout_times = stage.motor_sets.map(motor_set => get_burnout_from_motor_set(motor_set));
    return Math.max(...burnout_times);
}

function get_stage_burnout_times(config) {
    return config.map(stage => get_max_burnout_for_stage(stage)).map((cumulated_time = 0, time => cumulated_time += time));
}

function get_active_stages(burnout_times, time) {
    let active_stages = burnout_times.reduce((active_stages, burnout_time, index) => ((time <= burnout_time) && active_stages.push(index), active_stages), []);
    if(active_stages.length == 0) { active_stages = [burnout_times.length-1] };
    return active_stages;
}

function get_max_drag_area(config, active_stages) {
    let drag_areas = active_stages.map(stage_index => config[stage_index]).map(stage => stage.drag_coefficient * stage.diameter * stage.diameter * 3.14159 / 4.0);
    return Math.max(...drag_areas);
}

function get_current_total_mass(config, active_stages, stage_burnout_times, time) {
    let mass_per_stage = active_stages.map(stage_index => config[stage_index]).map((stage, stage_index) => {
        let time_since_stage_separation = time - (stage_burnout_times[active_stages[stage_index]-1] || 0.0);
        let mass_per_motor_set = stage.motor_sets.map(motor_set => {
            let time_since_motor_ignition = time_since_stage_separation - motor_set.ignition_delay;
            let mass_per_motor = interpolate_on_curve(time_since_motor_ignition, JSON.parse(localStorage.getItem(motor_set.motor)).mass_curve, "mass");
            return motor_set.number * mass_per_motor;
        });
        return stage.empty_mass + sum(mass_per_motor_set);
    });
    return sum(mass_per_stage);
}

function get_current_total_thrust(config, active_stages, stage_burnout_times, time) {
    let thrust_per_stage = active_stages.map(stage_index => config[stage_index]).map((stage, stage_index) => {
        let time_since_stage_separation = time - (stage_burnout_times[active_stages[stage_index]-1] || 0.0);
        let thrust_per_motor_set = stage.motor_sets.map(motor_set => {
            let time_since_motor_ignition = time_since_stage_separation - motor_set.ignition_delay;
            let thrust_per_motor = interpolate_on_curve(time_since_motor_ignition, JSON.parse(localStorage.getItem(motor_set.motor)).thrust_curve, "thrust");
            return motor_set.number * thrust_per_motor;
        });
        return sum(thrust_per_motor_set);
    });
    return sum(thrust_per_stage);
}

function run_simulation() {
    let config = get_rocket_configuration();
    let stage_burnout_times = get_stage_burnout_times(config);
    let active_stages = [];

    let temperature = check_convert_to_float(document.getElementById("temperature").value);
    let pressure = check_convert_to_float(document.getElementById("pressure").value);
    let guide_length = check_convert_to_float(document.getElementById("guide_length").value);

    let density = 1.225 * pressure/1013.25 / ((temperature + 273.15) / 288.15);

    let time = 0.0;
    let time_step_h = 0.01;
    let altitude = 0.0;
    let velocity = 0.0;
    let acceleration = 0.0;
    let last_altitude = 0.0;
    let mass = 0.0;

    let max_altitude = 0.0;
    let max_velocity = 0.0;
    let max_acceleration = 0.0;
    let min_acceleration = 0.0;
    let speed_at_guide_end = undefined;

    let C0;
    let C1;
    let C2;
    let C3;
    let K0;
    let K1;
    let K2;
    let K3;

    let delta_velocity;
    let delta_altitude;

    let altitude_data = [];
    let velocity_data = [];
    let acceleration_data = [];
    let mass_data = [];

    function calculate_acceleration(time, config, active_stages, stage_burnout_times, velocity, density) {
        let thrust = get_current_total_thrust(config, active_stages, stage_burnout_times, time);
        let total_mass = get_current_total_mass(config, active_stages, stage_burnout_times, time);
        let drag_area = get_max_drag_area(config, active_stages);
        let drag = density / 2.0 * velocity * velocity * drag_area;
        let gravity = total_mass * 9.81;

        let acceleration = (thrust - drag - gravity) / total_mass;

        return [acceleration, total_mass];
    }

    // from https://math.stackexchange.com/questions/2023819/using-the-runge-kuttas-method-to-solve-a-2nd-derivative-question
    // Y'' = f(t, Y, Y')
    // Y: altitude
    // Y': speed
    // Y'': acceleration (thrust - drag - gravity) - make sure it's not negative while altitude is 0!

    // K is an estimate of Y'' acceleration, so f is f(time, altitude, velocity), K = f(t, Y, C)
    // C is an estimate of Y' speed
    
    // C0 = Y',                 K0 = f(t, Y, C0)
    // C1 = Y' + h/2 K0         K1 = f(t+h/2, Y+h/2 C0, C1)
    // C2 = Y' + h/2 K1         K2 = f(t+h/2, Y+h/2 C1, C2)
    // C3 = Y' + h K2           K3 = f(t+h, Y+h C2, C3)
    
    // Vn+1 = V + h/6(K0 + 2K1 + 2K2 + K3)
    // Yn+1 = Y + h/6(C0 + 2C1 + 2C2 + C3)
    while(last_altitude <= altitude) {
        active_stages = get_active_stages(stage_burnout_times, time);

        last_altitude = altitude;
        C0 = velocity;
        [K0, m] = calculate_acceleration(time, config, active_stages, stage_burnout_times, C0, density);
        C1 = velocity + time_step_h / 2.0 * K0;
        [K1, m] = calculate_acceleration(time + time_step_h / 2.0, config, active_stages, stage_burnout_times, C1, density);
        C2 = velocity + time_step_h / 2.0 * K1;
        [K2, m] = calculate_acceleration(time + time_step_h / 2.0, config, active_stages, stage_burnout_times, C2, density);
        C3 = velocity + time_step_h * K2;
        [K3, m] = calculate_acceleration(time + time_step_h, config, active_stages, stage_burnout_times, C3, density);

        delta_velocity = time_step_h / 6.0 * (K0 + 2 * K1 + 2 * K2 + K3);
        delta_altitude = time_step_h / 6.0 * (C0 + 2 * C1 + 2 * C2 + C3);

        if(altitude <= 0.0) {
            if(delta_velocity < 0.0) { delta_velocity = 0.0; }
            if(delta_altitude < 0.0) { delta_altitude = 0.0; }
        }

        acceleration = delta_velocity / time_step_h;
        velocity = velocity + delta_velocity;
        altitude = altitude + delta_altitude;
        time = time + time_step_h;
        mass = m;

        if(speed_at_guide_end == undefined && altitude > guide_length) { speed_at_guide_end = velocity; }
        max_altitude = Math.max(altitude, max_altitude);
        max_velocity = Math.max(velocity, max_velocity);
        max_acceleration = Math.max(acceleration, max_acceleration);
        min_acceleration = Math.min(acceleration, min_acceleration);

        acceleration_data.push(acceleration);
        velocity_data.push(velocity);
        altitude_data.push(altitude);
        mass_data.push(mass * 1000.0); // return from doing calculations in kg to display in g
    }

    let simulation_summary = `<tr><td>Speed at end of launch guide</td><td>${Number(speed_at_guide_end.toPrecision(3))} m/s</td></tr>`;
    simulation_summary += `<tr><td>Max. acceleration</td><td>${Number(max_acceleration.toPrecision(3))} m/s<sup>2</sup></td></tr>`;
    simulation_summary += `<tr><td>Max. speed</td><td>${Number(max_velocity.toPrecision(3))} m/s</td></tr>`;
    simulation_summary += `<tr><td>Max. altitude</td><td>${Number(max_altitude.toPrecision(3))} m</td></tr>`;

    document.getElementById("simulation_overview").innerHTML = simulation_summary;

    draw_chart({ 
        "altitude": altitude_data, 
        "velocity": velocity_data,
        "acceleration": acceleration_data,
        "mass": mass_data,
    }, time, time_step_h, "chart");

}
